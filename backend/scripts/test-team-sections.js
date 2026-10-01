'use strict';
// Integration checks use an isolated database, never the configured camp data.
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
  let pool, server;
  try {
    await control.query('CREATE DATABASE `' + database + '`');
    await control.query('USE `' + database + '`');
    await control.query(fs.readFileSync(path.join(__dirname, '../../database/bdc-schema.sql'), 'utf8'));
    // Migration must also be safe to run on an already initialized database.
    await control.query(fs.readFileSync(path.join(__dirname, '../../database/migrate-team-sections.sql'), 'utf8'));
    process.env.DB_NAME = database;
    ({ pool } = require('../src/db'));
    await pool.query("INSERT INTO admins (full_name,email,password_hash,role,must_change_password) VALUES ('Super','super@example.invalid','unused','SUPER_ADMIN',0),('Allowed','allowed@example.invalid','unused','REGULAR_ADMIN',0),('Denied','denied@example.invalid','unused','REGULAR_ADMIN',0)");
    await pool.query("INSERT INTO admin_permissions (admin_id,permission_key,granted_by) VALUES (2,'camp.team',1)");
    for (const year of [2097, 2098]) await pool.query("INSERT INTO camps (camp_year,internal_name,public_title,camp_date,starts_at,ends_at,venue,registration_open,media_folder,created_by,updated_by) VALUES (?,'Test','Test',?,'09:00','16:00','Test',1,?,1,1)", [year, year + '-01-01', 'Test ' + year]);
    await pool.query('UPDATE site_state SET live_camp_id=1 WHERE id=1');
    const tokens = [];
    for (const id of [1, 2, 3]) {
      const raw = crypto.randomBytes(48);
      tokens.push(raw.toString('hex'));
      await pool.query('INSERT INTO admin_sessions (admin_id,token_hash,session_version,expires_at) VALUES (?,?,1,DATE_ADD(NOW(),INTERVAL 1 HOUR))', [id, crypto.createHash('sha256').update(raw).digest()]);
    }
    const app = express();
    app.use(express.json());
    app.use('/api/camps', require('../src/routes/team'));
    app.use('/api/public', require('../src/routes/public'));
    app.use((error, req, res, next) => res.status(500).json({ message: error.message }));
    server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
    const base = 'http://127.0.0.1:' + server.address().port;
    async function request(url, token = tokens[0], body) {
      const res = await fetch(base + url, { method: body ? 'PATCH' : 'GET', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
      return { status: res.status, body: await res.json() };
    }
    const initial = await request('/api/camps/1/team');
    assert.equal(initial.status, 200);
    assert.equal(initial.body.sections.length, 3);
    for (const section of initial.body.sections) {
      const url = '/api/camps/1/team/sections/' + section.key;
      const result = await request(url, tokens[1], { heading: '  Edited ' + section.label + '  ', description: ' Updated description ' });
      assert.equal(result.status, 200, JSON.stringify(result.body));
      assert.equal(result.body.data.label, 'Edited ' + section.label);
      assert.equal(result.body.data.desc, 'Updated description');
    }
    const reloaded = await request('/api/camps/1/team');
    assert.ok(reloaded.body.sections.every(s => s.label.startsWith('Edited ')));
    const publicTeam = await request('/api/public/team', null);
    assert.equal(publicTeam.status, 200, JSON.stringify(publicTeam.body));
    assert.deepEqual(publicTeam.body.data.sections, reloaded.body.sections);
    const otherCamp = await request('/api/camps/2/team');
    assert.deepEqual(otherCamp.body.sections, initial.body.sections);
    const url = '/api/camps/1/team/sections/MEMBERS';
    const valid = { heading: 'Members', description: '' };
    assert.equal((await request(url, tokens[0], valid)).body.data.desc, '');
    assert.equal((await request(url, null, valid)).status, 401);
    assert.equal((await request(url, tokens[2], valid)).status, 403);
    assert.equal((await request('/api/camps/2/team/sections/MEMBERS', tokens[1], valid)).status, 403);
    assert.equal((await request('/api/camps/1/team/sections/WEBSITE_TEAM', tokens[0], valid)).status, 400);
    for (const body of [{ heading: ' ', description: '' }, { heading: 'a'.repeat(151), description: '' }, { heading: 'Valid', description: 'a'.repeat(1001) }, { heading: 42, description: '' }]) {
      assert.equal((await request(url, tokens[0], body)).status, 400);
    }
    assert.equal((await request('/api/camps/999/team/sections/MEMBERS', tokens[0], valid)).status, 404);
    console.log('PASS: all three sections, save/reload, public output, camp isolation, blank description, authentication, permissions, validation, and repeatable migration.');
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    if (pool) await pool.end();
    await control.query('DROP DATABASE IF EXISTS `' + database + '`');
    await control.end();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
