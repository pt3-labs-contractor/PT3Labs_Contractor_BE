const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString:
    'postgres://tfspjacsulsvty:1cbb47d1a92acd351914bf46fc46d3f6e74713652c784ac3cb1fdd5a7f5d1998@ec2-54-83-192-245.compute-1.amazonaws.com:5432/d2ap5d5ja6qbuu?ssl=true',
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
  query(`DROP TABLE IF EXISTS feedback;`)
    .then(() => query(`DROP TABLE IF EXISTS appointments;`))
    .then(() => query(`DROP TABLE IF EXISTS services;`))
    .then(() => query(`DROP TABLE IF EXISTS users;`))
    .then(() => query(`DROP TABLE IF EXISTS schedules;`))
    .then(() => query(`DROP TABLE IF EXISTS contractors;`))
    .then(() => pool.end())
    .catch(err => err);
}
module.exports = {
  dropTables,
};
require('make-runnable');
