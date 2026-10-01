'use strict';
// Read-only metadata checks. Never prints passwords, grants, or donor records.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { pool } = require('../src/db');

(async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    const [[identity]] = await conn.query('SELECT VERSION() AS version, CURRENT_USER() AS account');
    const [grants] = await conn.query('SHOW GRANTS FOR CURRENT_USER');
    const grantTexts = grants.map(row => String(Object.values(row)[0]));
    const [variables] = await conn.query("SHOW VARIABLES WHERE Variable_name IN ('bind_address','require_secure_transport','local_infile','sql_mode')");
    const settings = Object.fromEntries(variables.map(row => [row.Variable_name, row.Value]));
    const [tls] = await conn.query("SHOW SESSION STATUS LIKE 'Ssl_cipher'");
    const account = String(identity.account);
    console.log(JSON.stringify({
      databaseVersion: identity.version,
      configuredHostIsLocal: ['localhost', '127.0.0.1', '::1'].includes(process.env.DB_HOST || 'localhost'),
      applicationUsesRoot: account.split('@')[0] === 'root',
      accountAllowsAnyHost: account.endsWith('@%'),
      passwordConfigured: Boolean(process.env.DB_PASSWORD),
      globalPrivilegesPresent: grantTexts.some(value => / ON \*\.\* /i.test(value) && !/^GRANT USAGE ON /i.test(value)),
      canGrantPrivileges: grantTexts.some(value => /WITH GRANT OPTION/i.test(value)),
      schemaChangePrivilegesPresent: grantTexts.some(value => /\b(ALL PRIVILEGES|CREATE|ALTER|DROP)\b/i.test(value)),
      roleGrantsPresent: grantTexts.some(value => /^GRANT /i.test(value) && !/ ON /i.test(value)),
      serverBindAddress: settings.bind_address ?? 'unavailable',
      encryptedConnection: Boolean(tls[0]?.Value),
      serverRequiresEncryption: settings.require_secure_transport ?? 'unavailable',
      serverLocalInfileEnabled: settings.local_infile ?? 'unavailable',
      strictSqlMode: /STRICT_(TRANS_TABLES|ALL_TABLES)/.test(settings.sql_mode || ''),
      note: 'This checks the configured database only. Firewall access, inherited role privileges, backup schedules and restore quality require separate verification.'
    }, null, 2));
  } catch (error) {
    console.error('Database check failed:', error.code || error.name);
    process.exitCode = 1;
  } finally {
    if (conn) conn.release();
    await pool.end();
  }
})();
