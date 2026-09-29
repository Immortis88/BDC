'use strict';
// Explicit offline deployment command. Never called by the web server.
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mysql = require('mysql2');
const { pool } = require('../src/db');
const storage = require('../src/storage');
const apply = process.argv.includes('--apply') && !process.argv.includes('--dry-run');
const backend = path.resolve(__dirname, '..');
const mapFile = path.join(backend, 'src/config/legacy-url-map.json');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const quote = name => '`' + name.replace(/`/g, '``') + '`';
function inside(root, rel) {
  if (typeof rel !== 'string' || /(^[/\\]|^[a-z]:|\0)/i.test(rel) || rel.split(/[/\\]/).includes('..')) throw new Error('Unsafe media path: ' + rel);
  const result = path.resolve(root, rel);
  if (!result.startsWith(path.resolve(root) + path.sep)) throw new Error('Unsafe media path.');
  return result;
}
function rewrite(value, mapping) {
  if (typeof value === 'string') return mapping[value] || value;
  if (Array.isArray(value)) return value.map(x => rewrite(x, mapping));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,x]) => [k,rewrite(x,mapping)]));
  return value;
}
async function exists(db, table) {
  const [rows] = await db.query('SELECT 1 FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=?', [table]);
  return rows.length > 0;
}
async function cols(db, table) { const [rows] = await db.query('SHOW COLUMNS FROM ' + quote(table)); return rows; }
async function backup(db, dir) {
  fs.mkdirSync(dir, { recursive: true }); // Deployment backup only, never upload/runtime storage.
  const [tables] = await db.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
  const statements = ['SET FOREIGN_KEY_CHECKS=0;', 'SET NAMES utf8mb4;'];
  for (const entry of tables) {
    const table = Object.values(entry)[0];
    const [[ddl]] = await db.query('SHOW CREATE TABLE ' + quote(table));
    statements.push('DROP TABLE IF EXISTS ' + quote(table) + ';', ddl['Create Table'] + ';');
    const [rows] = await db.query('SELECT * FROM ' + quote(table));
    for (const row of rows) {
      const values = Object.values(row).map(value => mysql.escape(value && typeof value === 'object' && !Buffer.isBuffer(value) && !(value instanceof Date) ? JSON.stringify(value) : value));
      statements.push('INSERT INTO ' + quote(table) + ' (' + Object.keys(row).map(quote).join(',') + ') VALUES (' + values.join(',') + ');');
    }
  }
  statements.push('SET FOREIGN_KEY_CHECKS=1;');
  fs.writeFileSync(path.join(dir,'restore.sql'), statements.join('\n'), { flag: 'wx' });
  fs.copyFileSync(mapFile, path.join(dir,'legacy-url-map.json'));
}
async function schema(db) {
  await db.query(`CREATE TABLE IF NOT EXISTS gallery_albums (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, description TEXT NULL,
    camp_year INT NULL, camp_date DATE NULL, camp_id BIGINT UNSIGNED NULL, cover_asset_id BIGINT UNSIGNED NULL,
    is_published TINYINT(1) NOT NULL DEFAULT 0, sort_order INT NOT NULL DEFAULT 0,
    created_by BIGINT UNSIGNED NULL, updated_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX ix_album_public (is_published,sort_order,id),
    CONSTRAINT fk_album_camp_v2 FOREIGN KEY (camp_id) REFERENCES camps(id) ON DELETE SET NULL,
    CONSTRAINT fk_album_cover_v2 FOREIGN KEY (cover_asset_id) REFERENCES media_assets(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  if (!await exists(db,'gallery_categories')) await db.query(`CREATE TABLE gallery_categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, camp_id BIGINT UNSIGNED NULL,
    name VARCHAR(100) NOT NULL, sort_order INT UNSIGNED NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  for (const table of ['gallery_photos','gallery_categories','media_assets']) {
    const columns = await cols(db,table);
    if (!columns.some(c=>c.Field==='album_id')) await db.query('ALTER TABLE '+quote(table)+' ADD COLUMN album_id BIGINT UNSIGNED NULL, ADD INDEX (album_id)');
    if (table!=='media_assets' && columns.some(c=>c.Field==='camp_id' && c.Null==='NO')) await db.query('ALTER TABLE '+quote(table)+' MODIFY camp_id BIGINT UNSIGNED NULL');
  }
  // A legacy unique(camp_id,name) prevents same-name categories in two albums linked to one camp.
  const [indexes] = await db.query('SHOW INDEX FROM gallery_categories');
  const names = [...new Set(indexes.filter(r=>r.Non_unique===0 && r.Key_name!=='PRIMARY').map(r=>r.Key_name))];
  for (const name of names) {
    const fields=indexes.filter(r=>r.Key_name===name).sort((a,b)=>a.Seq_in_index-b.Seq_in_index).map(r=>r.Column_name);
    if (fields.join(',')==='camp_id,name') {
      // Keep an index for an existing foreign key before removing its supporting unique index.
      await db.query('ALTER TABLE gallery_categories ADD INDEX ix_legacy_camp_repair (camp_id)');
      await db.query('ALTER TABLE gallery_categories DROP INDEX '+quote(name));
    }
  }
}
async function run() {
  const db = await pool.getConnection();
  let backupDir;
  try {
    const [[lock]] = await db.query("SELECT GET_LOCK('bdc_gallery_storage_repair', 0) acquired");
    if (!lock.acquired) throw new Error('Another repair is running.');
    const [assets] = await db.query('SELECT * FROM media_assets');
    const [photos] = await db.query('SELECT * FROM gallery_photos');
    const [categories] = await exists(db,'gallery_categories') ? await db.query('SELECT * FROM gallery_categories') : [[]];
    const [camps] = await db.query('SELECT * FROM camps');
    const [revisions] = await db.query('SELECT * FROM cms_revisions');
    const [[state]] = await db.query('SELECT live_camp_id FROM site_state WHERE id=1');
    const [visibility] = await db.query("SELECT camp_id,is_visible FROM camp_page_visibility WHERE page_key='gallery'");
    const [oldGrants] = await db.query("SELECT admin_id FROM admin_permissions WHERE permission_key='camp.gallery'");
    const oldMap = fs.existsSync(mapFile) ? JSON.parse(fs.readFileSync(mapFile,'utf8')) : {};
    const mapping = { ...oldMap };
    const configuredLegacy = process.env.MEDIA_ROOT && path.isAbsolute(process.env.MEDIA_ROOT) ? process.env.MEDIA_ROOT : null;
    const roots = [storage.MEDIA_ROOT, path.join(backend,'asset/Image'), ...(configuredLegacy ? [configuredLegacy] : [])];
    const copies = new Map();
    const changes = [];
    const missing = [];
    function plan(rel, folder, fixedName) {
      let src;
      for (const root of roots) { const p=inside(root,rel); if (fs.existsSync(p) && fs.statSync(p).isFile()) { src=p; break; } }
      if (!src && fixedName) { const p=inside(storage.MEDIA_ROOT,folder+'/'+fixedName); if(fs.existsSync(p))src=p; }
      if (!src) { missing.push(rel); return null; }
      const bytes=fs.readFileSync(src); const sha=hash(bytes);
      const alreadyFlat = rel.startsWith(folder+'/') && rel.split('/').length===2;
      const ext=path.extname(rel).toLowerCase();
      const destRel=folder+'/'+(fixedName || (alreadyFlat ? path.basename(rel) : 'migrated-'+hash(Buffer.from(rel)).slice(0,20)+ext));
      const dest=inside(storage.MEDIA_ROOT,destRel);
      if (fs.existsSync(dest) && hash(fs.readFileSync(dest))!==sha) throw new Error('Destination collision; refusing overwrite: '+destRel);
      copies.set(destRel,{source:src,destination:dest,relativePath:destRel,sha256:sha});
      if(rel!==destRel) {
        mapping['/media/'+rel]='/media/'+destRel;
        mapping['/media/'+rel.split('/').map(encodeURIComponent).join('/') ]='/media/'+destRel;
      }
      return { relative_path:destRel, sha256:Buffer.from(sha,'hex'), byte_size:bytes.length };
    }
    for (const a of assets) {
      const target=plan(a.relative_path, storage.getFolderForKind(a.media_kind));
      if(target) changes.push({id:a.id,...target});
    }
    for (const member of require('../src/config/website-team.json')) {
      const file=path.basename(member.photoPath);
      plan('Global/website-team/'+file,'teams',file);
    }
    // CMS sometimes stores local /media URLs without a media_assets record.
    function discover(value) {
      if (typeof value==='string' && value.startsWith('/media/')) {
        const rel=decodeURIComponent(value.slice(7));
        if (!mapping[value] && !assets.some(a=>a.relative_path===rel)) {
          const first=rel.split('/')[0];
          plan(rel, storage.VALID_FOLDERS.includes(first) ? first : 'camps');
        }
      } else if (Array.isArray(value)) value.forEach(discover);
      else if(value && typeof value==='object') Object.values(value).forEach(discover);
    }
    for(const r of revisions) discover(typeof r.payload==='string' ? JSON.parse(r.payload) : r.payload);
    console.log(JSON.stringify({mode:apply?'APPLY':'DRY RUN',mediaRoot:storage.MEDIA_ROOT,assets:assets.length,files:copies.size,missingFiles:[...new Set(missing)],legacyGalleryAdminIds:oldGrants.map(r=>r.admin_id)},null,2));
    if(missing.length) {
      if(process.argv.includes('--strict-files')) throw new Error('Missing image files; no database changes made.');
      console.warn('Existing missing files will be reported and their records preserved. They must be restored or replaced in the gallery; no substitute images are invented.');
    }
    if(!apply) { console.log('Dry run complete. No files, folders, or database rows changed. Run with --apply while the server is stopped.'); return; }
    // Four directories come from the patch package. Never create media folders here.
    storage.checkStorageHealth();
    backupDir=path.join(backend,'repair-backups',new Date().toISOString().replace(/[:.]/g,'-'));
    await backup(db,backupDir);
    fs.writeFileSync(path.join(backupDir,'manifest.json'),JSON.stringify({files:[...copies.values()],missingFiles:[...new Set(missing)],legacyGalleryAdminIds:oldGrants.map(r=>r.admin_id)},null,2));
    for(const item of copies.values()) {
      if(!fs.existsSync(item.destination)) fs.copyFileSync(item.source,item.destination,fs.constants.COPYFILE_EXCL);
      if(hash(fs.readFileSync(item.destination))!==item.sha256) throw new Error('Copied file checksum mismatch.');
    }
    await schema(db); // MySQL DDL commits implicitly. Full restore.sql covers rollback.
    await db.beginTransaction();
    try {
      // Migrate every camp with unassigned content; preserve already-created album edits.
      const campIds=[...new Set([...photos,...categories].filter(r=>!r.album_id && r.camp_id).map(r=>Number(r.camp_id)))];
      for(const campId of campIds) {
        const camp=camps.find(c=>Number(c.id)===campId);
        if(!camp) throw new Error('Gallery references missing camp '+campId);
        const [existing]=await db.query('SELECT id FROM gallery_albums WHERE camp_id=? ORDER BY id',[campId]);
        let albumId=existing.length===1 ? existing[0].id : null;
        if(!albumId) {
          const isPublic=Number(state?.live_camp_id)===campId && visibility.some(r=>Number(r.camp_id)===campId && r.is_visible);
          const [created]=await db.query('INSERT INTO gallery_albums (title,camp_year,camp_date,camp_id,is_published,sort_order) VALUES (?,?,?,?,?,?)',[camp.public_title || 'BDC Camp '+camp.camp_year,camp.camp_year,camp.camp_date,campId,isPublic?1:0,campId]);
          albumId=created.insertId;
        }
        await db.query('UPDATE gallery_photos SET album_id=? WHERE camp_id=? AND album_id IS NULL',[albumId,campId]);
        await db.query('UPDATE gallery_categories SET album_id=? WHERE camp_id=? AND album_id IS NULL',[albumId,campId]);
      }
      const [[unassigned]]=await db.query('SELECT COUNT(*) total FROM gallery_photos WHERE album_id IS NULL');
      const [[unassignedCats]]=await db.query('SELECT COUNT(*) total FROM gallery_categories WHERE album_id IS NULL');
      if(unassigned.total || unassignedCats.total) throw new Error('Some gallery rows have no camp or album; restore their association before migrating.');
      // Remove accidental dependence on a camp's lifecycle after album assignment.
      await db.query('UPDATE gallery_photos SET camp_id=NULL WHERE album_id IS NOT NULL');
      await db.query('UPDATE gallery_categories SET camp_id=NULL WHERE album_id IS NOT NULL');
      for(const row of changes) await db.query('UPDATE media_assets SET relative_path=?,sha256=?,byte_size=? WHERE id=?',[row.relative_path,row.sha256,row.byte_size,row.id]);
      // Repair existing gallery asset ownership. Clone metadata for shared media; preserve the physical file.
      const [links]=await db.query('SELECT p.id,p.album_id,p.asset_id,m.album_id owner,m.media_kind FROM gallery_photos p JOIN media_assets m ON m.id=p.asset_id ORDER BY p.id');
      const shared=new Map();
      for(const link of links) {
        const key=link.asset_id+':'+link.album_id;
        const [[media]]=await db.query('SELECT * FROM media_assets WHERE id=?',[link.asset_id]);
        if(!media.album_id && media.media_kind==='GALLERY') await db.query('UPDATE media_assets SET album_id=?,camp_id=NULL WHERE id=?',[link.album_id,link.asset_id]);
        else if(Number(media.album_id)!==Number(link.album_id) || media.media_kind!=='GALLERY') {
          // A unique relative_path disallows two metadata records sharing one path: copy with deterministic name.
          let newId=shared.get(key);
          if(!newId) {
            const newRel='gallery/shared-'+link.asset_id+'-'+link.album_id+path.extname(media.relative_path);
            const src=inside(storage.MEDIA_ROOT,media.relative_path), dest=inside(storage.MEDIA_ROOT,newRel);
            if(!fs.existsSync(dest)) fs.copyFileSync(src,dest,fs.constants.COPYFILE_EXCL);
            if(hash(fs.readFileSync(src))!==hash(fs.readFileSync(dest))) throw new Error('Shared asset checksum conflict.');
            const copy={...media,album_id:link.album_id,camp_id:null,media_kind:'GALLERY',relative_path:newRel}; delete copy.id;
            const [r]=await db.query('INSERT INTO media_assets SET ?',copy); newId=r.insertId; shared.set(key,newId);
          }
          await db.query('UPDATE gallery_photos SET asset_id=? WHERE id=?',[newId,link.id]);
          await db.query('UPDATE gallery_albums SET cover_asset_id=? WHERE id=? AND cover_asset_id=?',[newId,link.album_id,link.asset_id]);
        }
      }
      // Categories referenced by legacy photos but missing a category record are retained.
      await db.query(`INSERT INTO gallery_categories (album_id,camp_id,name,sort_order)
        SELECT DISTINCT p.album_id,NULL,p.category,0 FROM gallery_photos p
        WHERE p.category IS NOT NULL AND p.category<>'' AND NOT EXISTS
        (SELECT 1 FROM gallery_categories c WHERE c.album_id=p.album_id AND c.name=p.category)`);
      for(const r of revisions) {
        const before=typeof r.payload==='string'?JSON.parse(r.payload):r.payload;
        const after=rewrite(before,mapping);
        if(JSON.stringify(before)!==JSON.stringify(after)) await db.query('UPDATE cms_revisions SET payload=? WHERE id=?',[JSON.stringify(after),r.id]);
      }
      await db.query("INSERT INTO permission_definitions (permission_key,scope,description) VALUES ('website.gallery','GLOBAL','Manage global gallery albums') ON DUPLICATE KEY UPDATE scope='GLOBAL'");
      await db.query("DELETE FROM admin_permissions WHERE permission_key='camp.gallery'");
      await db.query("DELETE FROM permission_definitions WHERE permission_key='camp.gallery'");
      // Historical visibility/preferences remain for rollback, but are never read by gallery/team runtime.
      await db.commit();
    } catch(e) { await db.rollback(); throw e; }
    // Add relational constraints after backfill, including on partially migrated databases.
    for(const table of ['gallery_photos','gallery_categories','media_assets']) {
      const [fks]=await db.query('SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=? AND REFERENCED_TABLE_NAME=?',[table,'album_id','gallery_albums']);
      if(!fks.length) await db.query('ALTER TABLE '+quote(table)+' ADD CONSTRAINT '+quote('fk_'+table+'_album_repair')+' FOREIGN KEY (album_id) REFERENCES gallery_albums(id)');
    }
    const [ix]=await db.query('SHOW INDEX FROM gallery_categories');
    if(!ix.some(r=>r.Key_name==='uq_album_category_repair')) await db.query('ALTER TABLE gallery_categories ADD UNIQUE KEY uq_album_category_repair (album_id,name)');
    // Retain mappings from earlier runs and collapse chains. Never replace with an empty map on rerun.
    for(const key of Object.keys(mapping)) { let value=mapping[key]; const seen=new Set([key]); while(mapping[value]&&!seen.has(value)){seen.add(value);value=mapping[value];} mapping[key]=value; }
    fs.writeFileSync(mapFile+'.tmp',JSON.stringify(mapping,null,2)); fs.renameSync(mapFile+'.tmp',mapFile);
    console.log('Repair applied. Backup and rollback SQL: '+backupDir);
    console.log('Assign website.gallery explicitly to appropriate admins; the previous camp grant is not broadened automatically. Restart the server.');
  } catch(e) {
    if(backupDir) console.error('Backup retained at '+backupDir+'. Server must remain stopped until repair succeeds or restore.sql is applied.');
    throw e;
  } finally { await db.query("SELECT RELEASE_LOCK('bdc_gallery_storage_repair')").catch(()=>{}); db.release(); await pool.end(); }
}
if(require.main===module) run().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={rewrite,inside};
