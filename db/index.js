const { Pool } = require('pg');

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

module.exports = {
  query,
};
