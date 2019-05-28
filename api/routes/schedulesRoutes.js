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

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await query('SELECT * FROM schedules WHERE id = $1', [id]);
    if (!schedule.rows || !schedule.rows.length) {
      throw new Error(404);
    }
    return res.json({ schedule: schedule.rows });
  } catch (error) {
    switch (error.message) {
      case '404':
        return res
          .status(404)
          .json({ error: 'No schedule found with that ID.' });
      default:
        return res.status(500).json({ error: error.message });
    }
  }
});

// Post as a callback
// router.post('/', (req, res) => {
//   query(
//     'INSERT INTO schedules (contractor_id, start_time, duration) VALUES ($1, $2, $3) RETURNING *',
//     [req.body.contractor_id, req.body.start_time, req.body.duration],
//     (error, result) => {
//       if (error) {
//         throw error;
//       }
//       res.status(201).send(`user added with ID: ${result.rows[0].id}`);
//     }
//   );
// });

router.post('/', async (req, res) => {
  try {
    const schedule = await query(
      'INSERT * FROM schedules (contractor_id, start_time, duration) VALUES ($1, $2, $3) RETURNING *',
      [req.body.contractor_id, req.body.start_time, req.body.duration]
    );
    return res.json({ schedule: schedule.rows[0] });
  } catch (err) {
    return err;
  }
});

router.put('/:id', async (req, res) => {
  try {
    const schedule = await query(
      'UPDATE schedules SET contractor_id = ($1), start_time = ($2), duartion = ($3) RETURNING *',
      [
        req.body.contractor_id,
        req.body.start_time,
        req.body.duration,
        req.params.id,
      ]
    );
    return res.json({ row: schedule.rows[0] });
  } catch (err) {
    return err;
  }
});

// As a callback
// router.delete('/:id', (req, res) => {
//   const { id } = req.params;

//   query('DELETE FROM schedules WHERE id = $1', [id], (err, res) => {
//     if (err) {
//       throw err;
//     }
//     res.status(200).send(`schedule deleted with id: ${id}`);
//   });
// });

// As a promise
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  query('DELETE FROM schedules where id = $1', [id])
    .then(result => {
      res.status(200).json({
        status: 'success',
        message: `Removed ${result.rows[0]} from schedule`,
      });
    })
    .catch(err => {
      return err;
    });
});

module.exports = router;
