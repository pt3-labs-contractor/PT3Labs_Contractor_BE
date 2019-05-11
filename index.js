require('dotenv').config();
const express = require('express');
const app = express();
const { connect, disconnect, query } = require('./db');

connect();

query('SELECT * FROM contractors;')
  .then(res => console.log(res.rows))
  .catch(err => console.log('Error: ', err));

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server listening on port ${port}.`));
