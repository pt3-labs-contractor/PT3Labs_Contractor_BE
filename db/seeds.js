const { Pool } = require('pg');
const faker = require('faker');
require('dotenv').config();

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT,
  max: 90,
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

function contractorSeeds() {
  query('DELETE FROM contractors;');
  for (let i = 0; i < 500; i += 1) {
    query(
      `
          INSERT INTO contractors (name, phone_number, street_address, city, state_abbr, zip_code)
          VALUES ($1, $2, $3, $4, $5, $6);
        `,
      [
        faker.company.companyName(),
        faker.phone.phoneNumber(),
        faker.address.streetAddress(),
        faker.address.city(),
        faker.address.stateAbbr(),
        faker.address.zipCode(),
      ]
    );
  }
}

async function userSeeds() {
  query('DELETE FROM users;');
  const contractors = await query('SELECT * FROM contractors;');
  for (let i = 0; i < contractors.rows.length; i += 1) {
    const username = contractors.rows[i].name.replace(/\s/g, '') + i; // Add index, to be sure there are no repeating usernames
    query(
      `
      INSERT INTO users ( username, password, email, contractor_id)
      VALUES ( $1, $2, $3, $4);
    `,
      [
        username,
        faker.internet.password() + i,
        faker.internet.email() + i,
        contractors.rows[i].id,
      ]
    );
  }

  for (let i = 0; i < 500; i += 1) {
    query(
      `
        INSERT INTO users ( username, password, email, contractor_id )
        VALUES ( $1, $2, $3, $4);
      `,
      [
        faker.internet.userName() + i,
        faker.internet.password() + i,
        faker.internet.email() + i,
        null,
      ]
    );
  }
}

contractorSeeds();
setTimeout(userSeeds, 2000);
setTimeout(pool.end, 5000);

module.exports = {
  contractorSeeds,
  userSeeds,
};
