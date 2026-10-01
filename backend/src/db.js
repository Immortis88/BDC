'use strict';
const mysql = require('mysql2/promise');
const { databaseOptions } = require('./dbConfig');

const pool = mysql.createPool(databaseOptions());

/**
 * Test the connection pool on startup.
 * Throws if MySQL is unreachable so the server fails fast.
 */
async function testConnection() {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
  console.log(`[db] Connected to MySQL → ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT || 3306}`);
}

module.exports = { pool, testConnection };
