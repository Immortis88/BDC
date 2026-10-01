'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { pool } = require('../src/db');
const fs = require('fs');
const path = require('path');

async function migrate() {
  try {
    await pool.query(fs.readFileSync(path.join(__dirname, '../../database/migrate-team-sections.sql'), 'utf8'));
    console.log('Team section editing is ready. Existing sections retain their default text.');
  } finally {
    await pool.end();
  }
}
migrate().catch(error => { console.error(error.message); process.exitCode = 1; });
