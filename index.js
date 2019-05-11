require('dotenv').config();
const express = require('express');
const app = express();
const { connect, disconnect, query } = require('./db');

connect();

app.get('/contractors', (req, res) => {
  query('SELECT * FROM contractors;')
    .then(data => res.json({ contractors: data.rows }))
    .catch(error => res.status(500).json({ error: error.message }));
});

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server listening on port ${port}.`));
