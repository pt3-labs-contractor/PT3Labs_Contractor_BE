const express = require('express');
const { query } = require('../../db');

const router = express.Router();

router.get('/', async (req, res) => {
  const schedules = await query('SELECT * FROM schedules;');
  res.json({ schedules: schedules.rows });
});

module.exports = router;
