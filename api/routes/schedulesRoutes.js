const express = require('express');
const { query } = require('../../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const schedules = await query('SELECT * FROM schedules;');
    return res.json({ schedules: schedules.rows });
  } catch (error) {
    return res.json({ error: error.message });
  }
});

router.get('/contractorId', async (req, res) => {
  try {
    const { contractorId } = req.params;
    const schedule = await query(
      'SELECT * FROM schedules WHERE contractor_id = $1',
      [contractorId]
    );
    if (!schedule.rows || !schedule.rows.length) {
      throw new Error(404);
    }
    return res.json({ schedule: schedule.rows });
  } catch (error) {
    switch (error.message) {
      case '404':
        return res
          .status(404)
          .json({ error: 'No contractor found with that ID.' });
      default:
        return res.status(500).json({ error: error.message });
    }
  }
});

module.exports = router;
