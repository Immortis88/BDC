'use strict';
require('dotenv').config();
const { pool } = require('../src/db');

async function migrate() {
  try {
    console.log('Running donation status migration...');

    // Drop check constraint if present
    try {
      await pool.query('ALTER TABLE registrations DROP CHECK ck_registration_reason');
      console.log('Dropped constraint ck_registration_reason.');
    } catch (e) {
      console.log('ck_registration_reason already dropped or not present:', e.message);
    }

    const [upd] = await pool.query(
      "UPDATE registrations SET outcome = 'NOT_DONATED' WHERE outcome IN ('PENDING', 'DEFERRED')"
    );
    console.log(`Updated ${upd.affectedRows} existing rows to NOT_DONATED.`);

    await pool.query(
      "ALTER TABLE registrations MODIFY COLUMN outcome ENUM('DONATED','NOT_DONATED') NOT NULL DEFAULT 'NOT_DONATED'"
    );
    console.log('Successfully altered registrations.outcome ENUM to ("DONATED", "NOT_DONATED") DEFAULT "NOT_DONATED".');

    const [counts] = await pool.query('SELECT outcome, COUNT(*) as cnt FROM registrations GROUP BY outcome');
    console.log('Current outcomes distribution:', counts);

    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
