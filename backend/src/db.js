'use strict';

const mysql = require('mysql2/promise');
const fs = require('node:fs');

if (!process.env.DB_CA_PATH) {
  throw new Error('DB_CA_PATH is missing from App Env');
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 13928),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  ssl: {
    ca: fs.readFileSync(process.env.DB_CA_PATH, 'utf8'),
    rejectUnauthorized: true
  },

  charset: 'utf8mb4',
  timezone: 'Z',
  dateStrings: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 30000
});

async function testConnection() {
  const conn = await pool.getConnection();

  try {
    await conn.ping();
    console.log('[db] Connected to Aiven MySQL successfully');
  } finally {
    conn.release();
  }
}

module.exports = { pool, testConnection };