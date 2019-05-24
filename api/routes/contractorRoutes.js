const express = require('express');
const { query } = require('../../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const contractors = await query('SELECT * FROM contractors;');
    return res.json({ contractors: contractors.rows });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const contractor = await query('SELECT * FROM contractors WHERE id = $1;', [
      id,
    ]);
    if (!contractor.rows || !contractor.rows.length) {
      throw new Error(404);
    }
    return res.json({ contractor: contractor.rows });
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

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    name,
    phone_number,
    street_address,
    city,
    state_abbr,
    zip_code,
  } = req.body;
  try {
    const contractor = await query(
      'UPDATE contractors SET name = $1, phone_number = $2, street_address = $3, city = $4, state_abbr = $5, zip_code = $6, WHERE id= $7 RETURNING*',
      [name, phone_number, street_address, city, state_abbr, zip_code, id]
    );
    return res.json({ contractor: contractor.rows });
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
