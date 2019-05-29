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

function createContractorsTable() {
  return query(`
  CREATE TABLE IF NOT EXISTS contractors (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL UNIQUE,
    street_address TEXT NOT NULL,
    city TEXT NOT NULL,
    state_abbr VARCHAR(2) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  );
  `);
}

function createSchedulesTable() {
  return query(`
  CREATE TABLE IF NOT EXISTS schedules (
		id SERIAL,
    contractor_id UUID NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
		end_time TIMESTAMPTZ NOT NULL,
    duration INTERVAL NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (contractor_id, start_time),
    PRIMARY KEY (contractor_id, start_time),
    FOREIGN KEY (contractor_id) REFERENCES contractors(id)
    ON DELETE CASCADE
  );
  `);
}

function createUsersTable() {
  return query(`
  CREATE TABLE IF NOT EXISTS users (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    google_id TEXT UNIQUE,
    username TEXT UNIQUE,
    password TEXT UNIQUE,
    phone_number TEXT UNIQUE,
    email TEXT UNIQUE,
    contractor_id UUID DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (contractor_id) REFERENCES contractors(id)
    ON DELETE CASCADE,
    CONSTRAINT auth_origin CHECK (
      (CASE WHEN google_id IS NULL THEN 0 ELSE 1 END
      + CASE WHEN password IS NULL THEN 0 ELSE 1 END  
      ) > 0
    )
  );
  `);
}

function createServicesTable() {
  return query(`
  CREATE TABLE IF NOT EXISTS services (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    price MONEY DEFAULT NULL,
    contractor_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
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
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(contractor_id, user_id, service_id, appointment_datetime),
    FOREIGN KEY (contractor_id) REFERENCES contractors(id)
    ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id)
    ON DELETE SET NULL
  );
  `);
}

function createFeedbackTable() {
  return query(`
  CREATE TABLE feedback (
    id UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    contractor_id UUID NOT NULL,
    stars INT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL,
    FOREIGN KEY (contractor_id) REFERENCES contractors(id)
    ON DELETE SET NULL
  ); 
  `);
}

async function createIndices() {
  await query(`CREATE INDEX IX_contractors_state_abbr
    ON contractors (state_abbr);`);
  await query(`CREATE INDEX IX_contractors_city
    ON contractors (city);`);
  await query(`CREATE INDEX IX_contractors_zip_code
    ON contractors (zip_code);`);
  await query(`CREATE INDEX IX_schedules_start_time
    ON schedules (start_time);`);
  await query(`CREATE INDEX IX_users_cID
    ON users (contractor_id);`);
  await query(`CREATE INDEX IX_services_name
    ON services (name ASC);`);
  await query(`CREATE INDEX IX_services_price
    ON services (price ASC);`);
  await query(`CREATE INDEX IX_services_contractor_id
    ON services (contractor_id);`);
  await query(`CREATE INDEX IX_appointments_datetime
    ON appointments (appointment_datetime);`);
}
async function allTables() {
  await createContractorsTable();
  await createSchedulesTable();
  await createUsersTable();
  await createServicesTable();
  await createAppointmentsTable();
  await createFeedbackTable();
  await createIndices();
}

query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
  .then(createContractorsTable)
  .then(createSchedulesTable)
  .then(createUsersTable)
  .then(createServicesTable)
  .then(createAppointmentsTable)
  .then(createFeedbackTable)
  .then(createIndices)
  .then(() => pool.end())
  .catch(err => err);

module.exports = {
  createSchedulesTable,
  allTables,
};
require('make-runnable');
