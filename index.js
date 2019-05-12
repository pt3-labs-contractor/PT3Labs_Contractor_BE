require('dotenv').config();
const express = require('express');
const { query } = require('./db');

const app = express();

app.get('/contractors', (req, res) => {
  const contractors = query('SELECT * FROM contractors;');
  res.json({ contractors });
});

app.get('/users', (req, res) => {
  const users = query('SELECT * FROM users;');
  res.json({ users });
});

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server listening on port ${port}.`));
