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
    const user = await query('SELECT * FROM appointments WHERE id = $1', [id]);
    if (!user.rows || !user.rows.length) {
      throw new Error(404);
    }
    const isContractor = user.rows[0].contractorId;
    const attribute = isContractor ? 'contractorId' : 'userId';
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

router.post('/', async (req, res) => {
  try {
    const userAppt = await query(
      'INSERT INTO appointments ("contractorId", "userId", "serviceId", "appointmentDatetime", duration) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [
        req.body.contractorId,
        req.decoded.id,
        req.body.serviceId,
        req.body.apointmentDatetime,
        req.body.duration,
      ]
    );
    return res.json(userAppt.rows[0]);
  } catch (err) {
    return err;
  }
});

// Post as callback func
// will write later

router.put('/:id', async (req, res) => {
  try {
    const userAppt = await query(
      'UPDATE appointments SET "contractorId" = ($1), "appointmentDatetime" = ($2), duration = ($3) WHERE id = ($4) RETURNING *',
      [
        req.body.contractorId,
        req.body.appointmentDatetime,
        req.body.duration,
        req.params.id,
      ]
    );
    return res.json(userAppt.rows[0]);
  } catch (err) {
    return err;
  }
});

// As a callback
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  query('DELETE FROM appointments WHERE id = $1', [id], err => {
    if (err) {
      throw err;
    }
    res.status(200).send(`appointments deleted with id: ${id}`);
  });
});

module.exports = router;
