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

function createContractorsTable() {
  return query(`
    CREATE TABLE IF NOT EXISTS contractors (
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
    CREATE TABLE IF NOT EXISTS schedules (
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
    CREATE TABLE IF NOT EXISTS users (
      id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
      google_id VARCHAR(30) NOT NULL UNIQUE,
      username VARCHAR(50) NOT NULL UNIQUE,
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
    CREATE TABLE IF NOT EXISTS services (
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
    CREATE TABLE IF NOT EXISTS appointments (
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

function createFeedbackTable() {
  return query(`
  CREATE TABLE feedback
    (
        id UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id UUID NOT NULL,
        contractor_id UUID NOT NULL,
        stars INT NOT NULL,
        message VARCHAR(200) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (user_id) REFERENCES users(id)
            ON DELETE SET NULL,
        FOREIGN KEY (contractor_id) REFERENCES contractors(id)
            ON DELETE SET NULL
    );
  `);
}

query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
  .then(createContractorsTable)
  .then(createSchedulesTable)
  .then(createUsersTable)
  .then(createServicesTable)
  .then(createAppointmentsTable)
  .then(createFeedbackTable)
  .then(() => pool.end())
  .catch(err => err);
