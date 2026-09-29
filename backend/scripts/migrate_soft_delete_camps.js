'use strict';
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { pool } = require('../src/db');

async function migrate() {
  try {
    const [columns] = await pool.query("SHOW COLUMNS FROM camps LIKE 'deleted_at'");
    if (!columns.length) {
      await pool.query('ALTER TABLE camps ADD COLUMN deleted_at DATETIME(6) NULL DEFAULT NULL AFTER updated_at');
    }
    const [indexes] = await pool.query('SHOW INDEX FROM camps WHERE Key_name = ?', ['uq_camp_year']);
    if (indexes.length) await pool.query('ALTER TABLE camps DROP INDEX uq_camp_year');
    console.log('Camp soft-delete migration applied; existing rows and related data preserved.');
  } finally {
    await pool.end();
  }
}
migrate().catch(error => { console.error(error.message); process.exitCode = 1; });
