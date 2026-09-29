'use strict';
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { pool } = require('../src/db');

async function migrate() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, '../../database/migrations/20260928_staff_branch.sql'), 'utf8');
    await pool.query(sql);
    console.log('Staff branch constraint updated; existing registrations preserved.');
  } finally {
    await pool.end();
  }
}
migrate().catch(error => { console.error(error.message); process.exitCode = 1; });
