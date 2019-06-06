const express = require('express');
const { query } = require('../../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const user = req.user
    const isContractor = user.contractorId;
    const attribute = user.contractorId ? 'contractorId' : 'userId';
    const value = isContractor || user.id;
    const appointments = await query(
      `SELECT * FROM appointments WHERE "${attribute}" = $1`, // attribute will only ever be defined by server, no risk of injection.
      [value]
    );
    return res.json({ appointments: appointments.rows });
  } catch (error) {
      return res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const appointments = await query('SELECT * FROM appointments WHERE id = $1', [id]);
    if (!appointments.rows || !appointments.rows[0]) throw new Error(404);
    return res.json({ appointment: appointments.rows[0] });
  } catch(err){
    switch(err.message){
      case '404':
        return res.status(404).json({ error: 'No appointment with that ID found.' });
      default:
        return res.status(500).json({ error: 'There was an error while retrieving appointment.' });
    }
  }
});

router.get('/contractors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const appointments = await query('SELECT * FROM appointments WHERE contractorId = $1', [id]);
    if (!appointments.rows) throw new Error();
    return res.json({ appointments: appointments.rows });
  } catch(err){
    return res.status(500).json({ error: 'There was an error while retrieving appointments.' });
  }
});

// User, contractor, or both allowed to add/edit/delete?  Likely need permission from both.  For now, build either.

router.post('/', async (req, res) => {
  try {
    const { contractorId, serviceId, scheduleId, appointmentDatetime, duration } = req.body;
    const userAppt = await query(
      `INSERT INTO appointments ("contractorId", "userId", "serviceId", "scheduleId", "appointmentDatetime", duration) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *`,
      [
        contractorId,
        req.user.id,
        serviceId,
        scheduleId,
        appointmentDatetime,
        duration,
      ]
    );
    return res.json({ created: userAppt.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'There was an error while creating appointment.' });
  }
});

router.post('/contractor', async (req, res) => {
  try {
    const { userId, serviceId, scheduleId, appointmentDatetime, duration } = req.body;
    if (!userId || !serviceId || !scheduleId || !appointmentDatetime || !duration) 
      throw new Error(400);
    if (!req.user.contractorId || req.user.id === userId) 
      throw new Error(403);
    const user = await query('SELECT id FROM users WHERE id = $1 LIMIT 1', [userId]);
    const service = await query('SELECT contractorId from services WHERE id = $1', [serviceId]);
    const schedule = await query('SELECT contractorId from schedules WHERE id = $1', [scheduleId]);
    if (!user.rows || !user.rows[0]) 
      throw new Error('404 user');
    if (!service.rows || !service.rows[0]) 
      throw new Error('404 service');
    if (!schedule.rows || !schedule.rows[0])
      throw new Error('404 schedule');
    if (service.rows[0].contractorId !== req.user.contractorId || schedule.rows[0].contractorId !== req.user.contractorId) 
      throw new Error(403);
    const userAppt = await query(
      `INSERT INTO appointments ("contractorId", "userId", "serviceId", "scheduleId", "appointmentDatetime", duration) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *`,
      [
        req.user.contractorId,
        userId,
        serviceId,
        scheduleId,
        appointmentDatetime,
        duration,
      ]
    );
    return res.status(201).json({ created: userAppt.rows[0] });
  } catch(err) {
    switch(err.message){
      case '400':
        return res.status(400)
          .json({ error: 'Request body must includes values for "userId", "serviceId", "scheduleId", "appointmentDatetime", and "duration" keys.'});
      case '403':
        return res.status(403).json({ error: 'Forbidden' });
      case '404 user':
        return res.status(404).json({ error: 'No user with that ID found.' });
      case '404 service':
        return res.status(404).json({ error: 'No service with that ID found.' });
      case '404 schedule':
        return res.status(404).json({ error: 'No schedule with that ID found.' });
      default:
        return res.status(500).json({ error: 'There was an error while creating appointment.' });
    }
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const { appointmentDatetime, duration } = req.body;
    const appt = await query('SELECT * FROM appointments WHERE id = $1', [id]);
    if (!appt.rows || !appt.rows[0]) throw new Error(404);
    if (appt.rows[0].userId !== user.id
      && appt.rows[0].contractorId !== user.contractorId) throw new Error(403);
    const userAppt = await query(
      'UPDATE appointments SET "appointmentDatetime" = $1, duration = $2 WHERE id = $3 RETURNING *',
      [appointmentDatetime, duration, id]
    );
    return res.json({ updated: userAppt.rows[0] });
  } catch (err) {
    switch(err.message){
      case '403':
        return res.status(403).json({ error: 'Forbidden' });
      case '404':
        return res.status(404).json({ error: 'No appointment with that ID found.' });
      default:
        return res.status(500).json({ error: 'There was an error while updating appointment.' });
    }
  }
});

// As a callback
router.delete('/:id', async (req, res) => {
  try {
  const { id } = req.params;
  const { user } = req;
  const appt = await query('SELECT * FROM appointments WHERE id = $1', [id]);
  if (!appt.rows || !appt.rows[0]) throw new Error(404);
  if (appt.rows[0].userId !== user.id
    && appt.rows[0].contractorId !== user.contractorId) throw new Error(403);
  await query('DELETE FROM appointments WHERE id = $1', [id]);
  return res.json({ deleted: appt.rows[0] });
  } catch(err) {
    switch(err.message){
      case '403':
        return res.status(403).json({ error: 'Forbidden' });
      case '404':
        return res.status(404).json({ error: 'No appointment with that ID found.'});
      default:
        return res.status(500).json({ error: 'There was an error while deleting appointment.' });
    }
  }
});

module.exports = router;
