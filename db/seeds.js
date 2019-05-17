const { Pool } = require('pg');
const faker = require('faker');
const moment = require('moment');
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
        INSERT INTO users ( google_id, username, phone_number, email, contractor_id)
        VALUES ($1, $2, $3, $4, $5);
      `,
          [
            Math.random()
              .toString()
              .slice(2),
            username,
            contractors.rows[i].phone_number,
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
          INSERT INTO users ( google_id, username, phone_number, email, contractor_id )
          VALUES ( $1, $2, $3, $4, $5);
        `,
          [
            Math.random()
              .toString()
              .slice(2) + i,
            faker.internet.userName() + i,
            faker.phone.phoneNumber() + i,
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

function scheduleSeeds() {
  return new Promise(async resolve => {
    await query('DELETE FROM schedules;');
    const contractors = await query('SELECT * FROM contractors;');
    const promises = [];

    function getRandomInt(max) {
      return Math.floor(Math.random() * Math.floor(max)) + 1;
    }

    for (let i = 0; i < contractors.rows.length; i += 1) {
      const num = getRandomInt(5);
      for (let x = 0; x < num; x += 1) {
        promises.push(
          query(
            `
            INSERT INTO schedules ( contractor_id, start_time, duration )
            VALUES ( $1, $2, $3 );
            `,
            [
              contractors.rows[i].id,
              faker.date.between('2019-5-1', '2019-5-31'),
              `${faker.random.number({ min: 2, max: 5 })}h`,
            ]
          )
        );
      }
    }
    await Promise.all(promises);
    resolve();
  });
}

function servicesSeeds() {
  return new Promise(async resolve => {
    await query('DELETE FROM services;');
    const contractors = await query('SELECT * FROM contractors;');
    const promises = [];
    for (let i = 0; i < contractors.rows.length; i += 1) {
      const num = faker.random.number({ min: 1, max: 5 });
      for (let j = 0; j < num; j += 1) {
        promises.push(
          query(
            `INSERT INTO services (name, price, contractor_id)
        VALUES ($1, $2, $3)`,
            [
              'Test Service',
              faker.random.number({ min: 10, max: 100 }),
              contractors.rows[i].id,
            ]
          )
        );
      }
    }
    await Promise.all(promises);
    resolve();
  });
}

function appointmentSeeds() {
  // This code is messy, there seems to be something wrong with the timestamp (too many repeated values),
  // and it doesn't account for not overflowing the schedule time, but I will come back to it.  Data is seeded successfully.
  return new Promise(async resolve => {
    await query('DELETE FROM appointments;');
    const schedules = await query('SELECT * FROM schedules;');
    const promises = [];
    for (let i = 0; i < schedules.rows.length; i += 1) {
      const randomUser = await query(
        `SELECT id FROM users ORDER BY RANDOM() LIMIT 1;`
      );
      const servicesOffered = await query(
        `SELECT * FROM services WHERE contractor_id = $1`,
        [schedules.rows[i].contractor_id]
      );
      const timestamp = schedules.rows[i].start_time.toISOString();
      const startTime = moment(timestamp);
      const endTime = moment(timestamp).add(
        schedules.rows[i].duration.hours,
        'h'
      );
      const randomServiceIndex = faker.random.number({
        min: 0,
        max: servicesOffered.rows.length - 1,
      });
      const values = [
        schedules.rows[i].contractor_id,
        randomUser.rows[0].id,
        servicesOffered.rows[randomServiceIndex].id,
        faker.date.between(
          startTime.format('YYYY-M-D'),
          endTime.format('YYYY-M-D')
        ),
        `${faker.random.number({ min: 30, max: 60 })}m`,
      ];
      promises.push(
        query(
          `INSERT INTO appointments(contractor_id, user_id, service_id, appointment_datetime, duration)
          VALUES ($1, $2, $3, $4, $5)`,
          values
        )
      );
    }
    await Promise.all(promises);
    resolve();
  });
}

contractorSeeds()
  .then(() => userSeeds())
  .then(() => scheduleSeeds())
  .then(() => servicesSeeds())
  .then(() => appointmentSeeds())
  .then(() => pool.end())
  .catch(err => err);

module.exports = {
  contractorSeeds,
  userSeeds,
  scheduleSeeds,
};
