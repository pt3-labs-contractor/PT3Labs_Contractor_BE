const { Pool } = require('pg');
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
    console.log(error);
    await client.query('ROLLBACK');
  } finally {
    await client.release();
  }
}

function createContractorsTable() {
  return query(`
    CREATE TABLE contractors (
      id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      phone_number VARCHAR(30) NOT NULL UNIQUE,
      street_address VARCHAR(50) NOT NULL,
      city VARCHAR(25) NOT NULL,
      state_abbr VARCHAR(2) NOT NULL,
      zip_code VARCHAR(10) NOT NULL,
      created_at TIMESTAMP DEFAULT now()
    );
  `);
}

function createSchedulesTable() {
  return query(`
    CREATE TABLE schedules (
      contractor_id UUID NOT NULL,
      start_time TIMESTAMPTZ NOT NULL,
      duration INTERVAL NOT NULL,
      UNIQUE (contractor_id, start_time),
      created_at TIMESTAMP DEFAULT now(),
      FOREIGN KEY (contractor_id) REFERENCES contractors(id)
        ON DELETE CASCADE
    );
  `);
}

function createUsersTable() {
  return query(`
    CREATE TABLE users (
      id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      password VARCHAR(170) NOT NULL UNIQUE,
      email VARCHAR(50) NOT NULL UNIQUE,
      contractor_id UUID DEFAULT NULL,
      created_at TIMESTAMP DEFAULT now(),
      FOREIGN KEY (contractor_id) REFERENCES contractors(id)
        ON DELETE CASCADE
    );
  `);
}

function createServicesTable() {
  return query(`
    CREATE TABLE services (
      id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      price MONEY DEFAULT NULL,
      contractor_id UUID NOT NULL,
      created_at TIMESTAMP DEFAULT now(),
      FOREIGN KEY (contractor_id) REFERENCES contractors(id)
        ON DELETE CASCADE
    );
  `);
}

function createAppointmentsTable() {
  return query(`
    CREATE TABLE appointments (
      id UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4() PRIMARY KEY,
      contractor_id UUID NOT NULL,
      user_id UUID NOT NULL,
      service_id UUID NOT NULL,
      appointment_datetime TIMESTAMPTZ NOT NULL,
      duration INTERVAL NOT NULL,
      created_at TIMESTAMP DEFAULT now(),
      UNIQUE(contractor_id, user_id, service_id, appointment_datetime),
      FOREIGN KEY (contractor_id) REFERENCES contractors(id)
        ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,
      FOREIGN KEY (service_id) REFERENCES services(id)
        ON DELETE SET NULL -- Do not delete scheduled appointment if a service is removed - potential for abuse
    );
  `);
}

createContractorsTable()
  .then(createSchedulesTable)
  .then(createUsersTable)
  .then(createServicesTable)
  .then(createAppointmentsTable)
  .catch(err => console.log(err));

setTimeout(() => pool.end(), 5000);
