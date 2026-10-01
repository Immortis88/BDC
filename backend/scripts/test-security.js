'use strict';
// Runs local HTTP requests with an in-memory database double; no real donor data.
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcrypt');
const { passwordError, generatePassword, registrationError, errorHandler } = require('../src/security');
const { rateLimit } = require('../src/middleware/rateLimit');

const valid = { full_name: 'Test Donor', guardian_name: 'Test Guardian', date_of_birth: '2000-01-01', blood_group: 'O+', email: 'test@example.invalid', mobile: '9876543210', role: 'OUTSIDE_SKIT', consent_given: true, submission_key: crypto.randomUUID() };

test('registration rejects malformed types, lengths, consent, roles and mobile numbers', () => {
  assert.equal(registrationError(valid), null);
  for (const body of [null, [], { ...valid, consent_given: 'false' }, { ...valid, consent_given: 1 },
    { ...valid, mobile: 'not-a-phone' }, { ...valid, mobile: '12345678901' },
    { ...valid, full_name: {} }, { ...valid, full_name: 'x'.repeat(161) },
    { ...valid, participant_type: 'ADMIN' }, { ...valid, address: [] },
    { ...valid, submission_key: 'guessable' }, { ...valid, camp_id: {} }]) {
    assert.ok(registrationError(body));
  }
});

test('new passwords meet length and bcrypt byte limits; generated passwords are unpredictable', () => {
  for (const value of [null, {}, 'short', 'x'.repeat(73), '🔐'.repeat(19)]) assert.ok(passwordError(value));
  assert.equal(passwordError('a long password phrase'), null);
  const passwords = new Set(Array.from({ length: 100 }, generatePassword));
  assert.equal(passwords.size, 100);
  for (const value of passwords) assert.equal(passwordError(value), null);
});

test('rate limits isolate identities, expire, bound memory, and return Retry-After', () => {
  let clock = 0;
  const limiter = rateLimit({ max: 2, windowMs: 1000, capacity: 2, key: req => req.identity, now: () => clock });
  function call(identity) {
    const result = { headers: {}, statusCode: 200, allowed: false };
    const res = { setHeader: (k, v) => { result.headers[k] = v; }, status: n => { result.statusCode = n; return res; }, json: body => { result.body = body; } };
    limiter({ identity }, res, () => { result.allowed = true; });
    return result;
  }
  assert.ok(call('a').allowed); assert.ok(call('a').allowed);
  assert.equal(call('a').statusCode, 429);
  assert.equal(call('a').headers['Retry-After'], 1);
  assert.ok(call('b').allowed);
  assert.equal(call('c').statusCode, 429);
  clock = 1001;
  assert.ok(call('a').allowed); assert.ok(call('c').allowed);
});

test('HTTP registration privacy, authentication, password setup and error responses', async t => {
  let storedRegistration = null;
  let attemptHash = null;
  let inserts = 0;
  let mustChange = false;
  let role = 'SUPER_ADMIN';
  let version = 1;
  let hash = await bcrypt.hash('original password phrase', 4);
  const pool = {
    async query(sql, args = []) {
      if (sql.includes('FROM admin_sessions s')) return [[{ admin_id: 1, sess_ver: version, curr_ver: version, role, is_enabled: 1, must_change_password: mustChange }]];
      if (sql.includes('FROM admins WHERE email')) return [[{ id: 1, password_hash: hash, role, is_enabled: 1, must_change_password: mustChange, session_version: version }]];
      if (sql.includes('SELECT id, password_hash')) return [[{ id: 1, password_hash: hash, role, must_change_password: mustChange }]];
      if (sql.includes('UPDATE admins SET password_hash')) { hash = args[0]; mustChange = false; version++; return [{}]; }
      if (sql.includes('SELECT session_version')) return [[{ session_version: version }]];
      if (sql.includes('FROM admins WHERE id')) return [[{ id: 1, role, must_change_password: mustChange }]];
      if (sql.includes('FROM admin_permissions')) return [[]];
      if (sql.includes('INSERT INTO admin_sessions') || sql.includes('UPDATE admins SET last_login_at')) return [{ insertId: 1 }];
      if (sql.includes('FROM site_state')) return [[{ live_camp_id: 1 }]];
      if (sql.includes('FROM camps')) return [[{ id: 1, camp_year: 2026, registration_open: 1, public_title: 'Test camp' }]];
      if (sql.includes('FROM registrations WHERE')) return [storedRegistration ? [storedRegistration] : []];
      if (sql.includes('FROM registration_attempts')) return [attemptHash && args[0].equals(attemptHash) ? [{ id: 1 }] : []];
      if (sql.includes('FROM registration_counters')) return [[{ next_sequence: 1 }]];
      if (sql.includes('UPDATE registration_counters')) return [{}];
      if (sql.includes('INSERT INTO registrations')) {
        inserts++;
        storedRegistration = { id: 1, registration_code: args[2], full_name: args[3], created_at: new Date().toISOString() };
        return [{ insertId: 1 }];
      }
      if (sql.includes('INSERT INTO registration_attempts')) { attemptHash = args[1]; return [{ insertId: 1 }]; }
      if (sql.includes('INSERT INTO contact_messages')) return [{ insertId: 1 }];
      throw new Error('Unexpected test query: ' + sql);
    },
    async getConnection() { return { query: pool.query, beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}, release() {} }; }
  };
  require.cache[require.resolve('../src/db')] = { exports: { pool } };
  const app = express();
  app.use(express.json());
  app.use('/api/auth', require('../src/routes/auth'));
  app.use('/api/registrations', require('../src/routes/registrations'));
  app.use('/api/admin', require('../src/routes/admin'));
  app.use('/api', require('../src/routes/contact'));
  app.use('/api/upload', require('../src/routes/upload'));
  app.get('/private', require('../src/middleware/requireAuth'), (_req, res) => res.json({ ok: true }));
  app.get('/failure', (_req, _res, next) => next(new Error('SQL secret donor data')));
  app.use(errorHandler);
  const server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  t.after(() => { server.closeAllConnections(); server.close(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const token = crypto.randomBytes(48).toString('hex');
  const request = async (path, body, auth = false) => {
    const response = await fetch(base + path, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: 'Bearer ' + token } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, body: await response.json() };
  };
  assert.equal((await request('/private')).status, 401);
  assert.equal((await request('/private', undefined, true)).status, 200);
  mustChange = true;
  assert.equal((await request('/private', undefined, true)).body.code, 'PASSWORD_CHANGE_REQUIRED');
  assert.equal((await request('/api/auth/me', undefined, true)).status, 200);
  role = 'REGULAR_ADMIN';
  assert.equal((await request('/api/auth/change-password', { currentPassword: 'original password phrase', newPassword: 'short' }, true)).status, 400);
  assert.equal((await request('/api/auth/change-password', { currentPassword: 'original password phrase', newPassword: 'original password phrase' }, true)).status, 400);
  assert.equal((await request('/api/auth/change-password', { currentPassword: 'original password phrase', newPassword: 'replacement password phrase' }, true)).status, 200);
  assert.equal(mustChange, false);
  assert.equal((await request('/private', undefined, true)).status, 200);
  role = 'SUPER_ADMIN';
  assert.equal((await request('/api/admin/admins', { full_name: 'Test Admin', email: 'admin@example.invalid', temp_password: 'short' }, true)).status, 400);
  assert.equal((await request('/api/auth/login', { email: {}, password: 'test' })).status, 400);
  assert.equal((await request('/api/auth/login', { email: 'admin@example.invalid', password: 'replacement password phrase' })).status, 200);
  assert.equal((await request('/api/registrations', { ...valid, consent_given: 'false' })).status, 400);
  const first = await request('/api/registrations', valid);
  assert.equal(first.status, 201); assert.ok(first.body.data.registration_code);
  const retry = await request('/api/registrations', valid);
  assert.equal(retry.status, 200); assert.equal(retry.body.data.registration_code, first.body.data.registration_code);
  const other = await request('/api/registrations', { ...valid, submission_key: crypto.randomUUID() });
  assert.equal(other.status, 409); assert.equal(other.body.data, undefined); assert.equal(other.body.alreadyRegistered, undefined);
  assert.ok(!JSON.stringify(other.body).includes(first.body.data.registration_code));
  assert.equal(inserts, 1);
  const contact = { fullName: 'Test Visitor', email: 'visitor@example.invalid', subject: 'A question', message: 'This is a test inquiry.' };
  assert.equal((await request('/api/contact', { ...contact, message: {} })).status, 400);
  assert.equal((await request('/api/contact', contact)).status, 201);
  for (let i = 0; i < 4; i++) await request('/api/contact', contact);
  assert.equal((await request('/api/contact', contact)).status, 429);
  assert.equal((await request('/api/upload', {})).status, 401);
  const file = new FormData();
  file.append('file', new Blob(['This is not a PNG'], { type: 'image/png' }), 'fake.png');
  const upload = await fetch(base + '/api/upload', { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: file });
  assert.equal(upload.status, 400);
  for (let i = 0; i < 8; i++) await request('/api/registrations', valid);
  assert.equal((await request('/api/registrations', valid)).status, 429);
  const failure = await request('/failure');
  assert.equal(failure.status, 500); assert.ok(!JSON.stringify(failure.body).includes('SQL secret'));
});
