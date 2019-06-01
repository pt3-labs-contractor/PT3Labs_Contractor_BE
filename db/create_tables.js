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
    name TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL UNIQUE,
    "streetAddress" TEXT NOT NULL,
    city TEXT NOT NULL,
    "stateAbbr" VARCHAR(2) NOT NULL,
    "zipCode" VARCHAR(10) NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW()
  );
  `);
}

function createSchedulesTable() {
  return query(`
  CREATE TABLE IF NOT EXISTS schedules (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    "contractorId" UUID NOT NULL,
    "startTime" TIMESTAMPTZ NOT NULL,
    duration INTERVAL NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    UNIQUE ("contractorId", "startTime"),
    FOREIGN KEY ("contractorId") REFERENCES contractors(id)
    ON DELETE CASCADE
  );
  `);
}

function createUsersTable() {
  return query(`
  CREATE TABLE IF NOT EXISTS users (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    "googleId" TEXT UNIQUE,
    username TEXT UNIQUE,
    password TEXT UNIQUE,
    "phoneNumber" TEXT UNIQUE,
    email TEXT UNIQUE,
    "contractorId" UUID DEFAULT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY ("contractorId") REFERENCES contractors(id)
    ON DELETE CASCADE,
    CONSTRAINT auth_origin CHECK (
      (CASE WHEN "googleId" IS NULL THEN 0 ELSE 1 END
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
    "contractorId" UUID NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY ("contractorId") REFERENCES contractors(id)
    ON DELETE CASCADE
  );
  `);
}

function createAppointmentsTable() {
  return query(`
  CREATE TABLE IF NOT EXISTS appointments (
    id UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4() PRIMARY KEY,
    "contractorId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "serviceId" UUID NOT NULL,
    "scheduleId": UUID NOT NULL,
    "appointmentDatetime" TIMESTAMPTZ NOT NULL,
    duration INTERVAL NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    UNIQUE("contractorId", "userId", "serviceId", "appointmentDatetime"),
    FOREIGN KEY ("contractorId") REFERENCES contractors(id)
    ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES users(id)
    ON DELETE CASCADE,
    FOREIGN KEY ("serviceId") REFERENCES services(id)
    ON DELETE SET NULL,
    FOREIGN KEY ("scheduleId") REFERENCES schedules(id)
    ON DELETE CASCADE
  );
  `);
}

function createFeedbackTable() {
  return query(`
  CREATE TABLE feedback (
    id UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4() PRIMARY KEY,
    "userId" UUID,
    "contractorId" UUID,
    stars INT NOT NULL,
    message TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY ("userId") REFERENCES users(id)
    ON DELETE SET NULL,
    FOREIGN KEY ("contractorId") REFERENCES contractors(id)
    ON DELETE SET NULL
  ); 
  `);
}

async function createIndices() {
  await query(`CREATE INDEX IX_contractors_stateAbbr
    ON contractors ("stateAbbr");`);
  await query(`CREATE INDEX IX_contractors_city
    ON contractors ("city");`);
  await query(`CREATE INDEX IX_contractors_zipCode
    ON contractors ("zipCode");`);
  await query(`CREATE INDEX IX_schedules_startTime
    ON schedules ("startTime");`);
  await query(`CREATE INDEX IX_users_cID
    ON users ("contractorId");`);
  await query(`CREATE INDEX IX_services_name
    ON services (name ASC);`);
  await query(`CREATE INDEX IX_services_price
    ON services (price ASC);`);
  await query(`CREATE INDEX IX_services_contractorId
    ON services ("contractorId");`);
  await query(`CREATE INDEX IX_appointments_datetime
    ON appointments ("appointmentDatetime");`);
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
