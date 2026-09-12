// src/config/db.js
// ─────────────────────────────────────────────────────────────────────────────
// PostgreSQL Connection Pool
// A single shared pool used by ALL core services and module handlers.
// Modules must use this pool — they do NOT create their own connections.
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'hasi_tuition',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
  // Connection pool settings
  max:              10,    // max number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the connection on startup
pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'test') {
    console.log('[DB] New client connected to PostgreSQL pool');
  }
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client:', err.message);
  process.exit(-1);
});

/**
 * Convenience wrapper: runs a single query on a pooled client.
 * @param {string} text  - SQL query string
 * @param {Array}  params - Parameterized values
 */
const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
