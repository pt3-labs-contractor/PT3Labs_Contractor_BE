const express = require('express');
const { query } = require('../../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const services = await query('SELECT * FROM services;');
    return res.json({ services: services.rows });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/:contractorId', async (req, res) => {
  try {
    const { contractorId } = req.params;
    const services = await query(
      'SELECT * FROM services WHERE contractor_id = $1',
      [contractorId]
    );
    if (!services.rows || !services.rows.length) {
      throw new Error(404);
    }
    return res.json({ services: services.rows });
  } catch (error) {
    switch (error.message) {
      case '404':
        return res
          .status(404)
          .json({ error: 'No contractor with that ID found.' });
      default:
        return res.status(500).json({ error: error.message });
    }
  }
});

module.exports = router;
