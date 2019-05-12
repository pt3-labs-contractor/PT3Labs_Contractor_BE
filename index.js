require('dotenv').config();
const express = require('express');
const app = express();
const { query } = require('./db');
const { contractorSeeds, userSeeds } = require('./db/seeds');

(function handleSeeds() {
  contractorSeeds();
  setTimeout(userSeeds, 1000); // To ensure all contractor seeds are added before starting
})();

app.get('/contractors', (req, res) => {
  query('SELECT * FROM contractors;', (error, result) => {
    if (error) return res.status(500).json({ error: error.message });
    res.json({ contractors: result.rows });
  });
});

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server listening on port ${port}.`));
