'use strict';
const path = require('path');
const backendDir = path.join(__dirname, '..', 'backend');
const backendNodeModules = path.join(backendDir, 'node_modules');
require(path.join(backendNodeModules, 'dotenv')).config({ path: path.join(backendDir, '.env') });
const { pool } = require(path.join(backendDir, 'src', 'db'));

async function inspect() {
  try {
    console.log('--- ADMINS ---');
    const [admins] = await pool.query('SELECT id, full_name, email, role, created_at FROM admins');
    console.table(admins);

    console.log('\n--- REGISTRATIONS ---');
    const [regs] = await pool.query('SELECT id, camp_id, registration_code, full_name, email, mobile, outcome, created_at FROM registrations');
    console.table(regs);

    console.log('\n--- TEAM MEMBERS ---');
    const [team] = await pool.query('SELECT id, camp_id, group_key, full_name, role_label, phone, email FROM team_members');
    console.table(team);

    console.log('\n--- CONTACT MESSAGES ---');
    const [contacts] = await pool.query('SELECT id, sender_name, sender_email, subject, message, created_at FROM contact_messages');
    console.table(contacts);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

inspect();
