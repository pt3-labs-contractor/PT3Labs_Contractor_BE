const express = require('express');
const { query } = require('../../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const appointments = await query(`SELECT * FROM appointments;`);
    return res.json({ appointments: appointments.rows });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (!user.rows || !user.rows.length) {
      throw new Error(404);
    }
    const isContractor = user.rows[0].contractor_id;
    const attribute = isContractor ? 'contractor_id' : 'user_id';
    const value = isContractor || user.rows[0].id;
    const appointments = await query(
      `SELECT * FROM appointments WHERE ${attribute} = $1`, // attribute will only ever be defined by server, no risk of injection.
      [value]
    );
    return res.json({ appointments: appointments.rows });
  } catch (error) {
    switch (error.message) {
      case '404':
        return res.status(404).json({ error: 'No user with that ID found.' });
      default:
        return res.status(500).json({ error: error.message });
    }
  }
});

module.exports = router;
