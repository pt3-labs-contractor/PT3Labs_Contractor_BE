const { Pool } = require('pg');
const faker = require('faker');
require('dotenv').config();
const moment = require('moment');

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
    const contractors = await query('SELECT * FROM contractors;');
    const promises = [];

    function getRandomInt(max) {
      return Math.floor(Math.random() * Math.floor(max)) + 1;
    }

    for (let i = 0; i < contractors.rows.length; i += 1) {
      const num = getRandomInt(5);
      for (let x = 0; x < num; x += 1) {
        const startTime = faker.date.between('2019-5-1', '2019-5-31');
        const endTime = moment(startTime).add(num, 'hours');
        promises.push(
          query(
            `
            INSERT INTO schedules ( contractor_id, start_time, end_time, duration )
            VALUES ( $1, $2, $3, $4  );
            `,
            [contractors.rows[i].id, startTime, endTime, `${num}h`]
          )
        );
      }
    }
    await Promise.all(promises);
    resolve();
    console.log(promises);
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
  return new Promise(async resolve => {
    const schedules = await query('SELECT * FROM schedules;');
    let randomUsers = schedules.rows.map(() =>
      query(`SELECT id FROM users ORDER BY RANDOM() LIMIT 1;`)
    );
    let servicesOffered = schedules.rows.map(x =>
      query(`SELECT * FROM services WHERE contractor_id = $1;`, [
        x.contractor_id,
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
      const timestamp = schedules.rows[i].start_time.toISOString();
      const values = [
        schedules.rows[i].contractor_id,
        user.id,
        services[randomServiceIndex].id,
        timestamp,
        `${faker.random.number({ min: 60, max: 120 })}m`,
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
    console.log(randomUsers.length);
    console.log(randomUsers.reduce((a, b) => a + b.length, 0));
    const promises = [];
    for (let i = 0; i < contractors.rows.length; i += 1) {
      const users = randomUsers[i];
      for (let j = 0; j < users.length; j += 1) {
        promises.push(
          query(
            `INSERT INTO feedback (user_id, contractor_id, stars, message)
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

async function threeSeeds() {
  await contractorSeeds();
  await userSeeds();
  await scheduleSeeds();
}

// deleteFromTables()
//   .then(() => contractorSeeds())
//   .then(() => scheduleSeeds())
//   .then(() => userSeeds())
//   .then(() => servicesSeeds())
//   .then(() => appointmentSeeds())
//   .then(() => feedbackSeeds())
//   .then(() => pool.end())
//   .catch(err => err);

module.exports = {
  // contractorSeeds,
  // userSeeds,
  scheduleSeeds,
  threeSeeds,
  deleteFromTables,
};
require('make-runnable');
