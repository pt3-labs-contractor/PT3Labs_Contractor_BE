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

async function checkForLimit(req) {
  const { startTime, duration } = req.body;
  const date = new Date(startTime);
  if (Number.isNaN(date.getDate())) throw new Error(400);
  const dateShorthand = `${date.getFullYear()}-${date.getMonth() +
    1}-${date.getDate()}`;
  const dayOfWeek = date.getDay();
  const blocks = await query(
    `SELECT "startTime", duration FROM schedules
      WHERE "startTime" >= (date '${dateShorthand}T00:00:00' - interval '${dayOfWeek} days')
      AND "startTime" <= (date '${dateShorthand}T23:59:59' + interval '${7 -
      dayOfWeek} days')
      AND "contractorId" = $1;`,
    [req.user.contractorId]
  );
  if (!blocks.rows) throw new Error();
  const currentHours = blocks.rows.reduce((a, b) => {
    const hours =
      b.duration.hours + (b.duration.minutes ? b.duration.minutes / 60 : 0);
    return a + hours;
  }, 0);
  const newHours =
    typeof duration === 'object'
      ? duration.hours
      : Number((duration.match(/\d+(?=h)/) || [])[0]);
  const newMinutes =
    typeof duration === 'object'
      ? duration.minutes
      : Number((duration.match(/\d+(?=m)/) || [])[0]);
  let scheduleTime = 0;
  if (newHours) scheduleTime += newHours;
  if (newMinutes) scheduleTime += newMinutes / 60;
  if (currentHours + scheduleTime > 5) {
    throw new Error('limit');
  }
  return true;
}

router.post('/', async (req, res) => {
  try {
    const { user } = req;
    if (!user.contractorId) throw new Error(403);
    if (!user.subscriptionId) await checkForLimit(req);
    const schedule = await query(
      'INSERT INTO schedules ("contractorId", "startTime", duration) VALUES ($1, $2, $3) RETURNING *',
      [user.contractorId, req.body.startTime, req.body.duration]
    );
    return res.status(201).json({ created: schedule.rows[0] });
  } catch (err) {
    switch (err.message) {
      case '400':
        return res.status(400).json({ error: 'Invalid date format' });
      case 'limit':
        return res.status(403).json({
          error:
            'Only subscribers may schedule more than 5 hours of availability per week.',
        });
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
    const { startTime, duration, open } = req.body;
    const { user } = req;
    const entry = await query(
      'SELECT "contractorId" FROM schedules WHERE id = $1',
      [id]
    );
    if (!entry.rows || !entry.rows[0]) throw new Error(404);
    if (user.contractorId !== entry.rows[0].contractorId) throw new Error(403);
    const schedule = await query(
      'UPDATE schedules SET "startTime" = $1, duration = $2, open = $3 WHERE id = $4 RETURNING *;',
      [startTime, duration, open, id]
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
