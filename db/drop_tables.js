const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT,
  max: 20,
  idleTimeoutMillis: 0,
});

async function query(text, values) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(text, values);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    return error;
  } finally {
    await client.release();
  }
}

function dropTables() {
  query(`DROP TABLE IF EXISTS stripe;`)
    .then(() => query(`DROP TABLE IF EXISTS feedback;`))
    .then(() => query(`DROP TABLE IF EXISTS appointments;`))
    .then(() => query(`DROP TABLE IF EXISTS services;`))
    .then(() => query(`DROP TABLE IF EXISTS users;`))
    .then(() => query(`DROP TABLE IF EXISTS schedules;`))
    .then(() => query(`DROP TABLE IF EXISTS contractors;`))
    .then(() => pool.end())
    .catch(err => err);
}

dropTables();
