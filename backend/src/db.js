'use strict';
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               Number(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'bdc',
  charset:            'utf8mb4',
  timezone:           'Z',           // store/read as UTC
  dateStrings:        true,          // return DATE and TIME as strings, preventing timezone shifting
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  enableKeepAlive:    true,
  keepAliveInitialDelay: 30000
});

/**
 * Test the connection pool on startup.
 * Throws if MySQL is unreachable so the server fails fast.
 */
async function testConnection() {
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
  console.log(`[db] Connected to MySQL → ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT || 3306}`);
}

module.exports = { pool, testConnection };
