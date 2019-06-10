const { Pool } = require('pg');
const faker = require('faker');
const axios = require('axios');
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

function deleteFromTables() {
  return new Promise(async resolve => {
    await query('DELETE FROM feedback;');
    await query('DELETE FROM appointments;');
    await query('DELETE FROM services;');
    await query('DELETE FROM users;');
    await query('DELETE FROM schedules;');
    await query('DELETE FROM contractors;');
    resolve();
  });
}

function contractorSeeds() {
  return new Promise(async resolve => {
    const promises = [];
    for (let i = 0; i < 250; i += 1) {
      const zipCode = faker.address.zipCode();
      const response = await axios.get(
        `https://dev.virtualearth.net/REST/v1/Locations?countryRegion=US&postalCode=${zipCode}&key=${process.env.BING_MAPS_KEY}`
      );
      const [latitude, longitude] = response.data.resourceSets[0].resources
        .length
        ? response.data.resourceSets[0].resources[0].point.coordinates
        : [null, null];
      promises.push(
        query(
          `
            INSERT INTO contractors (name, "phoneNumber", "streetAddress", city, "stateAbbr", "zipCode", latitude, longitude)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
          `,
          [
            faker.company.companyName(),
            faker.phone.phoneNumber(),
            faker.address.streetAddress(),
            faker.address.city(),
            faker.address.stateAbbr(),
            zipCode,
            latitude,
            longitude,
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
    const contractors = await query('SELECT * FROM contractors;');
    const promises = [];
    for (let i = 0; i < contractors.rows.length; i += 1) {
      const username = contractors.rows[i].name.replace(/\s/g, '') + i; // Add index, to be sure there are no repeating usernames
      promises.push(
        query(
          `
        INSERT INTO users ( "googleId", username, "phoneNumber", email, "contractorId")
        VALUES ($1, $2, $3, $4, $5);
      `,
          [
            Math.random()
              .toString()
              .slice(2),
            username,
            contractors.rows[i].phoneNumber,
            faker.internet.email() + i,
            contractors.rows[i].id,
          ]
        )
      );
    }

    for (let i = 0; i < 250; i += 1) {
      promises.push(
        query(
          `
          INSERT INTO users ( "googleId", username, "phoneNumber", email, "contractorId" )
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
    const contractors = await query('SELECT * FROM contractors;');
    const promises = [];
    for (let i = 0; i < contractors.rows.length; i += 1) {
      const num = faker.random.number({ min: 1, max: 5 });
      for (let x = 0; x < num; x += 1) {
        promises.push(
          query(
            `
            INSERT INTO schedules ( "contractorId", "startTime", duration )
            VALUES ( $1, $2, $3 );
            `,
            [
              contractors.rows[i].id,
              faker.date.between('2019-6-1', '2019-6-30'),
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
    const contractors = await query('SELECT * FROM contractors;');
    const promises = [];
    for (let i = 0; i < contractors.rows.length; i += 1) {
      const num = faker.random.number({ min: 1, max: 5 });
      for (let j = 0; j < num; j += 1) {
        promises.push(
          query(
            `INSERT INTO services (name, price, "contractorId")
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
  return new Promise(async resolve => {
    const schedules = await query('SELECT * FROM schedules;');
    let randomUsers = schedules.rows.map(() =>
      query(`SELECT id FROM users ORDER BY RANDOM() LIMIT 1;`)
    );
    let servicesOffered = schedules.rows.map(x =>
      query(`SELECT * FROM services WHERE "contractorId" = $1;`, [
        x.contractorId,
      ])
    );
    randomUsers = await Promise.all(randomUsers);
    servicesOffered = await Promise.all(servicesOffered);
    const promises = [];
    for (let i = 0; i < schedules.rows.length; i += 1) {
      const [user] = randomUsers[i].rows;
      const services = servicesOffered[i].rows;
      const randomServiceIndex = faker.random.number({
        min: 0,
        max: services.length - 1,
      });
      const timestamp = schedules.rows[i].startTime.toISOString();
      const values = [
        schedules.rows[i].contractorId,
        user.id,
        services[randomServiceIndex].id,
        schedules.rows[i].id,
        timestamp,
        `${faker.random.number({ min: 60, max: 120 })}m`,
        'true',
      ];
      promises.push(
        query(
          `INSERT INTO appointments("contractorId", "userId", "serviceId", "scheduleId", "startTime", duration, confirmed)
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          values
        )
      );
    }
    await Promise.all(promises);
    resolve();
  });
}

function feedbackSeeds() {
  return new Promise(async resolve => {
    const contractors = await query('SELECT * FROM contractors;');
    const randomNums = contractors.rows.map(() =>
      faker.random.number({ min: 1, max: 5 })
    );
    let randomUsers = randomNums.map(n => {
      return query('SELECT * FROM users ORDER BY RANDOM() LIMIT $1;', [n])
        .then(res => res.rows)
        .catch(err => {
          throw new Error(err);
        });
    });
    randomUsers = await Promise.all(randomUsers);
    const promises = [];
    for (let i = 0; i < contractors.rows.length; i += 1) {
      const users = randomUsers[i];
      for (let j = 0; j < users.length; j += 1) {
        promises.push(
          query(
            `INSERT INTO feedback ("userId", "contractorId", stars, message)
            VALUES ($1, $2, $3, $4);`,
            [
              users[j].id,
              contractors.rows[i].id,
              faker.random.number({ min: 1, max: 5 }),
              faker.lorem.sentences(),
            ]
          )
        );
      }
    }
    await Promise.all(promises);
    resolve();
  });
}

deleteFromTables()
  .then(() => contractorSeeds())
  .then(() => scheduleSeeds())
  .then(() => userSeeds())
  .then(() => servicesSeeds())
  .then(() => appointmentSeeds())
  .then(() => feedbackSeeds())
  .then(() => pool.end())
  .catch(err => err);

module.exports = {
  contractorSeeds,
  userSeeds,
  scheduleSeeds,
};
