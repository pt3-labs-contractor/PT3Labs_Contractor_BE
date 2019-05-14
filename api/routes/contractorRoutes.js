const express = require('express');
const { query } = require('../../db');

const router = express.Router();

router.get('/', async (req, res) => {
  const contractors = await query('SELECT * FROM contractors;');
  res.json({ contractors: contractors.rows });
});

module.exports = router;
