'use strict';
const path = require('path');
const fs = require('fs');
const backendDir = path.join(__dirname, '..', 'backend');
const backendNodeModules = path.join(backendDir, 'node_modules');
require(path.join(backendNodeModules, 'dotenv')).config({ path: path.join(backendDir, '.env') });
const { pool } = require(path.join(backendDir, 'src', 'db'));

async function backup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'database', 'cleanup_backups', `pre-cleanup-${timestamp}`);
  fs.mkdirSync(backupDir, { recursive: true });

  console.log(`[backup] Creating restorable backup in: ${backupDir}`);

  const [tables] = await pool.query('SHOW TABLES');
  const tableKey = Object.keys(tables[0])[0];
  
  let dumpSql = `-- Pre-cleanup Database Backup\n-- Generated: ${new Date().toISOString()}\n\nSET FOREIGN_KEY_CHECKS = 0;\n\n`;
  const jsonBackup = {};

  for (const t of tables) {
    const tableName = t[tableKey];
    console.log(`[backup] Dumping table: ${tableName}`);

    const [[createTable]] = await pool.query(`SHOW CREATE TABLE \`${tableName}\``);
    dumpSql += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
    dumpSql += `${createTable['Create Table']};\n\n`;

    const [rows] = await pool.query(`SELECT * FROM \`${tableName}\``);
    jsonBackup[tableName] = rows;

    if (rows.length > 0) {
      dumpSql += `INSERT INTO \`${tableName}\` VALUES\n`;
      const rowStrings = rows.map(row => {
        const values = Object.values(row).map(val => {
          if (val === null) return 'NULL';
          if (Buffer.isBuffer(val)) return `X'${val.toString('hex')}'`;
          if (typeof val === 'number') return val;
          if (typeof val === 'boolean') return val ? 1 : 0;
          return `'${String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
        });
        return `(${values.join(', ')})`;
      });
      dumpSql += `${rowStrings.join(',\n')};\n\n`;
    }
  }

  dumpSql += `SET FOREIGN_KEY_CHECKS = 1;\n`;

  const sqlPath = path.join(backupDir, 'database-pre-cleanup.sql');
  const jsonPath = path.join(backupDir, 'database-pre-cleanup.json');

  fs.writeFileSync(sqlPath, dumpSql, 'utf8');
  fs.writeFileSync(jsonPath, JSON.stringify(jsonBackup, null, 2), 'utf8');

  console.log(`[backup] Successfully wrote:\n- ${sqlPath} (${fs.statSync(sqlPath).size} bytes)\n- ${jsonPath} (${fs.statSync(jsonPath).size} bytes)`);
  process.exit(0);
}

backup().catch(err => {
  console.error('[backup] Failed:', err);
  process.exit(1);
});
