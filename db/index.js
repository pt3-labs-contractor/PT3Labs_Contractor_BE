const { Pool } = require('pg');

const pool = new Pool();

async function query(text, values) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(text, values);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    console.log(error);
    await client.query('ROLLBACK');
  } finally {
    await client.release();
  }
}

module.exports = {
  query,
};
