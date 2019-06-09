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

router.get('/contractor/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await query(
      'SELECT * FROM schedules WHERE "contractorId" = $1',
      [id]
    );
    if (!schedule.rows) {
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
//     'INSERT INTO schedules (contractorId, startTime, duration) VALUES ($1, $2, $3) RETURNING *',
//     [req.body.contractorId, req.body.startTime, req.body.duration],
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
    const { user } = req;
    if (!user.contractorId) throw new Error(403);
    const schedule = await query(
      'INSERT INTO schedules ("contractorId", "startTime", duration) VALUES ($1, $2, $3) RETURNING *',
      [user.contractorId, req.body.startTime, req.body.duration]
    );
    return res.status(201).json({ created: schedule.rows[0] });
  } catch (err) {
    switch (err.message) {
      case '403':
        return res.status(403).json({ error: 'Forbidden' });
      default:
        return res
          .status(500)
          .json({ error: 'There was an error while adding to schedule.' });
    }
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const entry = await query(
      'SELECT "contractorId" FROM schedules WHERE id = $1',
      [id]
    );
    if (!entry.rows || !entry.rows[0]) throw new Error(404);
    if (user.contractorId !== entry.rows[0].contractorId) throw new Error(403);
    const schedule = await query(
      'UPDATE schedules SET "contractorId" = $1, "startTime" = $2, duration = $3 WHERE id = $4 RETURNING *;',
      [user.contractorId, req.body.startTime, req.body.duration, id]
    );
    return res.json({ updated: schedule.rows[0] });
  } catch (err) {
    switch (err.message) {
      case '403':
        return res.status(403).json({ error: 'Forbidden' });
      case '404':
        return res
          .status(404)
          .json({ error: 'No schedule block found with that ID.' });
      default:
        return res.status(500).json({
          error: 'There was an error while trying to update schedule block.',
        });
    }
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
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const entry = await query('SELECT * FROM schedules WHERE id = $1', [id]);
    if (!entry.rows || !entry.rows[0]) throw new Error(404);
    if (user.contractorId !== entry.rows[0].contractorId) throw new Error(403);
    await query('DELETE FROM schedules WHERE id = $1', [id]);
    return res.json({ deleted: entry.rows[0] });
  } catch (err) {
    switch (err.message) {
      case '403':
        return res.status(403).json({ error: 'Forbidden' });
      case '404':
        return res.status(404).json({ error: 'No entry found by that ID.' });
      default:
        return res.status(500).json({
          error: 'There was an error while attempting to delete entry.',
        });
    }
  }
});

// Come back to this
router.get('/date/:dateString', async (req, res) => {
  try {
    const { dateString } = req.params;
    const date = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(date.getDate())) throw new Error(400);
    const dateShorthand = `${date.getFullYear()}-${date.getMonth() +
      1}-${date.getDate()}`;
    const appointments = await query(
      `SELECT * FROM schedules WHERE DATE_TRUNC('day', "startTime") = $1;`,
      [dateShorthand]
    );
    if (!appointments.rows) throw new Error();
    return res.json({ appointments: appointments.rows });
  } catch (err) {
    switch (err.message) {
      case '400':
        return res.status(400).json({ error: 'Invalid date string.' });
      default:
        return res
          .status(500)
          .json({ error: 'There was an error while retrieving appointments.' });
    }
  }
});

module.exports = router;
