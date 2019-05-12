require('dotenv').config();
const express = require('express');
const { query } = require('./db');

const app = express();

app.get('/contractors', async (req, res) => {
  const contractors = await query('SELECT * FROM contractors;');
  res.json({ contractors: contractors.rows });
});

app.get('/users', async (req, res) => {
  const users = await query(
    'SELECT id, username, email, contractor_id, created_at FROM users;'
  );
  res.json({ users: users.rows });
});

app.get('/schedules', async (req, res) => {
  const schedules = await query('SELECT * FROM schedules;');
  res.json({ schedules: schedules.rows });
});

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server listening on port ${port}.`));
