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
  return new Promise(async resolve => {
    await query('DELETE FROM contractors;');
    const promises = [];
    for (let i = 0; i < 500; i += 1) {
      promises.push(
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
        )
      );
    }
    await Promise.all(promises);
    resolve();
  });
}

function userSeeds() {
  return new Promise(async resolve => {
    await query('DELETE FROM users;');
    const contractors = await query('SELECT * FROM contractors;');
    const promises = [];
    for (let i = 0; i < contractors.rows.length; i += 1) {
      const username = contractors.rows[i].name.replace(/\s/g, '') + i; // Add index, to be sure there are no repeating usernames
      promises.push(
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
        )
      );
    }

    for (let i = 0; i < 500; i += 1) {
      promises.push(
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
        )
      );
    }
    await Promise.all(promises);
    resolve();
  });
}

contractorSeeds()
  .then(() => userSeeds())
  .then(() => pool.end())
  .catch(err => err);

module.exports = {
  contractorSeeds,
  userSeeds,
};
