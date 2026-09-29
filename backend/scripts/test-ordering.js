'use strict';
// All writes are confined to a randomly named disposable database.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');
const crypto = require('crypto');
const assert = require('node:assert/strict');
const express = require('express');
(async () => {
  const database = 'bdc_test_' + crypto.randomBytes(8).toString('hex');
  const control = await mysql.createConnection({ host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT) || 3306, user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '', multipleStatements: true });
  let pool, server, checks = 0;
  const check = (value, message) => { assert.ok(value, message); checks++; console.log('PASS ' + message); };
  try {
    await control.query('CREATE DATABASE `' + database + '`');
    await control.query('USE `' + database + '`');
    await control.query(fs.readFileSync(path.join(__dirname, '../../database/bdc-schema.sql'), 'utf8'));
    process.env.DB_NAME = database;
    ({ pool } = require('../src/db'));
    await require('../src/websiteTeam').initialize();
    const hash = await require('bcrypt').hash('OrderingTest123!', 4);
    await pool.query("INSERT INTO admins (full_name,email,password_hash,role,must_change_password) VALUES ('Test Super','super@example.invalid',?,'SUPER_ADMIN',0),('Test Allowed','allowed@example.invalid',?,'REGULAR_ADMIN',0),('Test Denied','denied@example.invalid',?,'REGULAR_ADMIN',0)", [hash, hash, hash]);
    for (const key of ['camp.team', 'camp.gallery', 'camp.sponsors']) await pool.query('INSERT INTO admin_permissions (admin_id,permission_key,granted_by) VALUES (2,?,1)', [key]);
    for (const year of [2097, 2098]) await pool.query("INSERT INTO camps (camp_year,internal_name,public_title,camp_date,starts_at,ends_at,venue,registration_open,media_folder,created_by,updated_by) VALUES (?, 'Ordering Test','Ordering Test',?,'09:00','16:00','Test',1,?,1,1)", [year, year + '-01-01', 'Test ' + year]);
    await pool.query('UPDATE site_state SET live_camp_id=1 WHERE id=1');
    for (const camp of [1, 2]) for (const page of ['team', 'gallery', 'sponsors']) await pool.query('INSERT INTO camp_page_visibility (camp_id,page_key,is_visible,updated_by) VALUES (?,?,1,1)', [camp, page]);
    const tokens = [];
    for (const id of [1, 2, 3]) { const raw = crypto.randomBytes(48); tokens.push(raw.toString('hex')); await pool.query('INSERT INTO admin_sessions (admin_id,token_hash,session_version,expires_at) VALUES (?,?,1,DATE_ADD(NOW(),INTERVAL 1 HOUR))', [id, crypto.createHash('sha256').update(raw).digest()]); }
    async function seed() {
      for (const [camp, group, name] of [[1,'MEMBERS','Member Alpha'],[1,'MEMBERS','Member Beta'],[1,'MEMBERS','Member Gamma'],[1,'CHIEF_COORDINATOR','Chief Alpha'],[1,'CHIEF_COORDINATOR','Chief Beta'],[2,'MEMBERS','Other camp'],[1,'WEBSITE_TEAM','Legacy Website Member']]) await pool.query('INSERT INTO team_members (camp_id,group_key,full_name,role_label,phone,email,sort_order,created_by,updated_by) VALUES (?,?,?,\'\',\'1234567890\',\'keep@example.invalid\',0,1,1)', [camp,group,name]);
      await pool.query("INSERT INTO media_assets (media_kind,relative_path,mime_type,byte_size,width_px,height_px,sha256,uploaded_by) VALUES ('GALLERY','Global/website-team/bharat-dhakad.jpg','image/jpeg',1,100,100,?,1)", [Buffer.alloc(32)]);
      for (let i=0;i<4;i++) await pool.query('INSERT INTO gallery_photos (camp_id,asset_id,category,alt_text,caption,sort_order,created_by,updated_by) VALUES (?,1,?,?,?,0,1,1)', [i===3?2:1, i===1?'Team':'Donors', 'Photo '+(i+1), 'Photo '+(i+1)]);
      await pool.query("CREATE TABLE IF NOT EXISTS gallery_categories (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,camp_id BIGINT UNSIGNED NOT NULL,name VARCHAR(100) NOT NULL,sort_order INT NOT NULL DEFAULT 0)");
      await pool.query("INSERT INTO gallery_categories (camp_id,name) VALUES (1,'Donors'),(1,'Team')");
      for (const [camp, heading] of [[1,'Section Alpha'],[1,'Section Beta'],[2,'Other Section']]) await pool.query('INSERT INTO sponsor_sections (camp_id,heading,sort_order,created_by,updated_by) VALUES (?,?,0,1,1)', [camp,heading]);
      for (const [section,name] of [[1,'Sponsor Alpha'],[1,'Sponsor Beta'],[2,'Sponsor Gamma'],[2,'Sponsor Delta'],[3,'Other Sponsor']]) await pool.query('INSERT INTO sponsors (section_id,name,logo_asset_id,sort_order,created_by,updated_by) VALUES (?,?,1,0,1,1)', [section,name]);
    }
    await seed();
    const app = express(); app.use(express.json());
    app.use('/api/auth',require('../src/routes/auth'));
    app.use('/api/admin/website-team',require('../src/routes/websiteTeam'));
    app.use('/api/admin',require('../src/routes/admin'));
    for (const route of ['camps','team','gallery','sponsors']) app.use('/api/camps',require('../src/routes/'+route));
    app.use('/api/public',require('../src/routes/public'));
    app.use('/media',express.static(path.join(__dirname,'../asset/Image')));
    app.use(express.static(path.join(__dirname,'../../frontend/dist')));
    app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'../../frontend/dist/index.html')));
    app.use((err,req,res,next)=>res.status(500).json({ok:false,message:err.message}));
    server = await new Promise(resolve=>{ const s=app.listen(0,'127.0.0.1',()=>resolve(s)); });
    const base = 'http://127.0.0.1:'+server.address().port;
    const request = (url, method='GET', body, token=tokens[0]) => fetch(base+url,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});
    const get = async url => (await (await request(url)).json()).data;
    const configs = [
      {route:'team/reorder', table:'team_members', scope:{groupKey:'MEMBERS'}, ids:[1,2,3], alien:6, mixed:4},
      {route:'gallery/reorder', table:'gallery_photos', scope:{}, ids:[1,2,3], alien:4},
      {route:'sponsors/reorder-sections', table:'sponsor_sections', scope:{}, ids:[1,2], alien:3},
      {route:'sponsors/reorder-sponsors', table:'sponsors', scope:{sectionId:1}, ids:[1,2], alien:5, mixed:3}
    ];
    for (const c of configs) {
      const url='/api/camps/1/'+c.route, order=[...c.ids].reverse();
      const [before]=await pool.query(`SELECT * FROM ${c.table} ORDER BY id`);
      check((await request(url,'PUT',{...c.scope,orderedIds:order,previousIds:c.ids},tokens[1])).status===200,c.route+' authorized reorder');
      const [rows]=await pool.query(`SELECT id FROM ${c.table} WHERE id IN (?) ORDER BY sort_order,id`,[c.ids]);
      check(JSON.stringify(rows.map(r=>r.id))===JSON.stringify(order),c.route+' persisted SQL order');
      const [after]=await pool.query(`SELECT * FROM ${c.table} ORDER BY id`);
      const content=rows=>rows.map(({sort_order,updated_at,...r})=>r);
      check(JSON.stringify(content(before))===JSON.stringify(content(after)),c.route+' content unchanged');
      for (const ids of [[order[0],order[0]], [...order.slice(0,-1),c.alien], [], ['1'], [999999]]) check((await request(url,'PUT',{...c.scope,orderedIds:ids})).status===400,c.route+' invalid/duplicate/cross-camp IDs rejected');
      if(c.mixed) check((await request(url,'PUT',{...c.scope,orderedIds:[order[0],c.mixed]})).status===400,c.route+' cross-group rejected');
      check((await request(url,'PUT',{...c.scope,orderedIds:c.ids,previousIds:c.ids})).status===409,c.route+' stale save rejected');
      check((await request(url,'PUT',{...c.scope,orderedIds:order},tokens[2])).status===403,c.route+' missing permission rejected');
      check((await request(url,'PUT',{...c.scope,orderedIds:order},null)).status===401,c.route+' unauthenticated rejected');
      check((await request('/api/camps/2/'+c.route,'PUT',{...c.scope,orderedIds:order},tokens[1])).status===403,c.route+' regular admin other camp rejected');
    }
    check((await get('/api/camps/1/team')).filter(p=>p.group_key==='MEMBERS').map(p=>p.id).join()==='3,2,1','Admin team order');
    check((await get('/api/public/team')).members.map(p=>p.name).join()==='Member Gamma,Member Beta,Member Alpha','Public team order');
    check((await get('/api/camps/1/gallery')).map(p=>p.id).join()==='3,2,1','Admin gallery order');
    const gallery=await get('/api/public/gallery');
    check(gallery.photos.map(p=>p.id).join()==='3,2,1','Public gallery canonical order');
    check(gallery.photos.filter(p=>p.category==='Donors').map(p=>p.id).join()==='3,1','Category relative order');
    check(!Object.hasOwn(gallery,'pastCamps'),'Past galleries absent');
    const sponsors=await get('/api/public/sponsors');
    check(sponsors.map(s=>s.heading).join()==='Section Beta,Section Alpha','Public sponsor sections order');
    check(sponsors.flatMap(s=>s.sponsors).map(s=>s.name).join()==='Sponsor Gamma,Sponsor Delta,Sponsor Beta,Sponsor Alpha','Homepage sponsor flattened order');
    // Force failure after the first SQL update to prove transaction rollback.
    await pool.query("CREATE TRIGGER ordering_failure BEFORE UPDATE ON gallery_photos FOR EACH ROW BEGIN IF NEW.id = 2 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Injected ordering failure'; END IF; END");
    check((await request('/api/camps/1/gallery/reorder','PUT',{orderedIds:[1,2,3],previousIds:[3,2,1]})).status===500,'Injected failure reaches caller');
    check((await get('/api/camps/1/gallery')).map(p=>p.id).join()==='3,2,1','Failed transaction fully rolls back');
    await pool.query('DROP TRIGGER ordering_failure');
    const expected=['Bharat Dhakad','Aryan Sharma','Rahul Saini','Chetan Yadav'];
    let team=await get('/api/public/team');
    check(JSON.stringify(team.websiteTeam.map(p=>p.name))===JSON.stringify(expected),'Exact fixed roster order, no legacy duplicate');
    check(team.websiteTeam.every(p=>!('phone' in p)),'Hidden fixed numbers omitted from public response');
    for(const person of team.websiteTeam) check((await request(person.photoUrl)).status===200,'Original permanent portrait served: '+person.name);
    for(const [method,url,body] of [['POST','/api/camps/1/team',{full_name:'Injected',group_key:'WEBSITE_TEAM'}],['PATCH','/api/camps/1/team/7',{group_key:'MEMBERS'}],['DELETE','/api/camps/1/team/7'],['PATCH','/api/camps/1/team/1',{group_key:'WEBSITE_TEAM'}]]) check((await request(url,method,body)).status===403,'Fixed roster write blocked: '+method+' '+url);
    check((await request('/api/camps/1/team/reorder','PUT',{groupKey:'WEBSITE_TEAM',orderedIds:[7]})).status===400,'Fixed roster reorder blocked');
    check((await request('/api/admin/website-team/bharat-dhakad','PATCH',{show_phone_publicly:true},tokens[1])).status===403,'Global phone setting Super Admin only');
    check((await request('/api/admin/website-team/bharat-dhakad','PATCH',{name:'Changed',show_phone_publicly:true})).status===400,'Global identity modification blocked');
    check((await request('/api/admin/website-team/bharat-dhakad','PATCH',{show_phone_publicly:true})).status===200,'Global phone setting saved');
    check(Boolean((await get('/api/public/team')).websiteTeam[0].phone),'Enabled populated phone returned');
    await pool.query("UPDATE camp_page_visibility SET is_visible=0 WHERE camp_id=1 AND page_key='team'");
    team=await get('/api/public/team'); check(team.members.length===0&&team.websiteTeam.length===4,'Camp visibility leaves fixed roster');
    await pool.query('UPDATE site_state SET live_camp_id=2 WHERE id=1');
    check((await get('/api/public/team')).websiteTeam[0].phone===team.websiteTeam[0].phone,'Camp switch preserves global preference');
    await pool.query('UPDATE site_state SET live_camp_id=NULL WHERE id=1');
    check((await get('/api/public/team')).websiteTeam.length===4,'No live camp preserves fixed roster');
    // Delete only disposable fixture data, then recreate one camp.
    for(const table of ['gallery_photos','gallery_categories','team_members','sponsors','sponsor_sections','media_assets','camp_page_visibility','camps']) await pool.query('DELETE FROM '+table);
    check((await get('/api/public/team')).websiteTeam.length===4,'All fixture camps deleted: fixed roster remains');
    await pool.query("INSERT INTO camps (id,camp_year,internal_name,public_title,camp_date,starts_at,ends_at,venue,media_folder,created_by,updated_by) VALUES (1,2097,'Ordering Test','Ordering Test','2097-01-01','09:00','16:00','Test','Test 2097',1,1),(2,2098,'Other Test','Other Test','2098-01-01','09:00','16:00','Test','Test 2098',1,1)");
    await pool.query('UPDATE site_state SET live_camp_id=1 WHERE id=1');
    check((await get('/api/public/team')).websiteTeam.length===4,'New camp automatically includes fixed roster');
    console.log(`${checks} checks passed in isolated database.`);
    if (process.argv.includes('--serve')) {
      // Reset auto-increments only in the disposable database for predictable browser fixtures.
      for(const table of ['gallery_photos','gallery_categories','team_members','sponsors','sponsor_sections','media_assets']) await pool.query('ALTER TABLE '+table+' AUTO_INCREMENT=1');
      await seed();
      console.log(`BROWSER_FIXTURE ${base} — super@example.invalid / OrderingTest123! — press Enter to clean up.`);
      await new Promise(resolve=>{ process.stdin.once('data',resolve); setTimeout(resolve,30*60*1000).unref(); });
    }
  } finally {
    if(server) { server.closeAllConnections(); await new Promise(resolve=>server.close(resolve)); }
    if(pool) await pool.end();
    if(!/^bdc_test_[a-f0-9]{16}$/.test(database)) throw Error('Unsafe cleanup target');
    await control.query('DROP DATABASE IF EXISTS `'+database+'`'); await control.end();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
