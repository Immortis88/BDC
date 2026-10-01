'use strict';
const fs = require('fs');

function databaseOptions(env = process.env, readFile = fs.readFileSync) {
  const options = {
    host: env.DB_HOST || 'localhost',
    port: Number(env.DB_PORT) || 3306,
    user: env.DB_USER || 'root',
    password: env.DB_PASSWORD || '',
    database: env.DB_NAME || 'bdc',
    charset: 'utf8mb4',
    timezone: 'Z',
    dateStrings: true,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 30000,
    // Values stay values: JSON objects must not expand into SQL expressions.
    stringifyObjects: true,
    multipleStatements: false,
    flags: ['-LOCAL_FILES']
  };
  // Opt in only when the hosting provider has supplied TLS connection details.
  // There is intentionally no insecure certificate-verification bypass.
  if (env.DB_SSL === 'true') {
    options.ssl = { rejectUnauthorized: true, verifyIdentity: true, minVersion: 'TLSv1.2' };
    if (env.DB_SSL_CA_FILE) options.ssl.ca = readFile(env.DB_SSL_CA_FILE, 'utf8');
  }
  return options;
}

module.exports = { databaseOptions };
