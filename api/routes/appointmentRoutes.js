const express = require('express');
const Twilio = require('twilio');
const { query } = require('../../db');

const router = express.Router();

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_ACCOUNT_TOKEN;
const twilioClient = new Twilio(twilioAccountSid, twilioAuthToken);

router.get('/', async (req, res) => {
  try {
    const { user } = req;
    const isContractor = user.contractorId;
    const attribute = user.contractorId ? 'contractorId' : 'userId';
    const value = isContractor || user.id;
    const appointments = await query(
      `SELECT a.id, username, c.name as "contractorName", a."contractorId", a."userId", a."serviceId", s.name as service, price, a."startTime", duration, confirmed, a."createdAt" 
      FROM appointments a 
      JOIN contractors c
      ON c.id = a."contractorId"
      JOIN users u
      ON u.id = a."userId"
      JOIN services s
      ON s.id = a."serviceId"
      WHERE a."${attribute}" = $1`, // attribute will only ever be defined by server, no risk of injection.
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
    const appointments = await query(
      'SELECT * FROM appointments WHERE id = $1',
      [id]
    );
    if (!appointments.rows || !appointments.rows[0]) throw new Error(404);
    return res.json({ appointment: appointments.rows[0] });
  } catch (err) {
    switch (err.message) {
      case '404':
        return res
          .status(404)
          .json({ error: 'No appointment with that ID found.' });
      default:
        return res
          .status(500)
          .json({ error: 'There was an error while retrieving appointment.' });
    }
  }
});

router.get('/contractors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const appointments = await query(
      `SELECT a.id, a."contractorId", a."userId", a."serviceId", "scheduleId", c.name as "contractorName", username, s.name as service, price, a."startTime", confirmed, duration, a."createdAt"  
      FROM appointments a
      JOIN users u
      ON u.id = a."userId"
      JOIN contractors c
      ON c.id = a."contractorId"
      JOIN services s
      ON s.id = a."serviceId"
      WHERE a."contractorId" = $1`,
      [id]
    );
    if (!appointments.rows) throw new Error();
    return res.json({ appointments: appointments.rows });
  } catch (err) {
    return res
      .status(500)
      .json({ error: 'There was an error while retrieving appointments.' });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.id !== id) throw new Error(403);
    const appointments = await query(
      'SELECT * FROM appointments WHERE "userId" = $1',
      [id]
    );
    if (!appointments.rows) throw new Error();
    return res.json({ appointments: appointments.rows });
  } catch (err) {
    switch (err.message) {
      case '403':
        return res.status(403).json({ error: 'Forbidden' });
      default:
        return res.status(500).json({
          error: 'There was a problem while retrieving appointments.',
        });
    }
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      contractorId,
      serviceId,
      scheduleId,
      startTime,
      duration,
    } = req.body;
    const contractor = await query(
      'SELECT "phoneNumber" FROM contractors WHERE id = $1',
      [contractorId]
    );
    if (!contractor.rows || !contractor.rows[0]) throw new Error(404);
    const userAppt = await query(
      `INSERT INTO appointments ("contractorId", "userId", "serviceId", "scheduleId", "startTime", duration) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *`,
      [contractorId, req.user.id, serviceId, scheduleId, startTime, duration]
    );
    const contractorPhoneNumber = contractor.rows[0].phoneNumber;
    twilioClient.messages
      .create({
        to: contractorPhoneNumber,
        from: '+17323297090',
        body: 'A client has booked an appointment! Please log in to confirm.',
      })
      .then(message => console.log(message))
      .catch(err => console.log('ERROR: ', err));
    return res.json({ created: userAppt.rows[0] });
  } catch (err) {
    switch (err.message) {
      case '404':
        return res
          .status(404)
          .json({ error: 'No contractor found with that ID.' });
      default:
        return res
          .status(500)
          .json({ error: 'There was an error while creating appointment.' });
    }
  }
});

router.post('/contractor', async (req, res) => {
  try {
    const { userId, serviceId, scheduleId, startTime, duration } = req.body;
    if (!userId || !serviceId || !scheduleId || !startTime || !duration)
      throw new Error(400);
    if (!req.user.contractorId || req.user.id === userId) throw new Error(403);
    const user = await query('SELECT id FROM users WHERE id = $1 LIMIT 1', [
      userId,
    ]);
    const service = await query(
      'SELECT contractorId from services WHERE id = $1',
      [serviceId]
    );
    const schedule = await query(
      'SELECT contractorId from schedules WHERE id = $1',
      [scheduleId]
    );
    if (!user.rows || !user.rows[0]) throw new Error('404 user');
    if (!service.rows || !service.rows[0]) throw new Error('404 service');
    if (!schedule.rows || !schedule.rows[0]) throw new Error('404 schedule');
    if (
      service.rows[0].contractorId !== req.user.contractorId ||
      schedule.rows[0].contractorId !== req.user.contractorId
    )
      throw new Error(403);
    const userAppt = await query(
      `INSERT INTO appointments ("contractorId", "userId", "serviceId", "scheduleId", "startTime", duration) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *`,
      [
        req.user.contractorId,
        userId,
        serviceId,
        scheduleId,
        startTime,
        duration,
      ]
    );
    return res.status(201).json({ created: userAppt.rows[0] });
  } catch (err) {
    switch (err.message) {
      case '400':
        return res.status(400).json({
          error:
            'Request body must includes values for "userId", "serviceId", "scheduleId", "startTime", and "duration" keys.',
        });
      case '403':
        return res.status(403).json({ error: 'Forbidden' });
      case '404 user':
        return res.status(404).json({ error: 'No user with that ID found.' });
      case '404 service':
        return res
          .status(404)
          .json({ error: 'No service with that ID found.' });
      case '404 schedule':
        return res
          .status(404)
          .json({ error: 'No schedule with that ID found.' });
      default:
        return res
          .status(500)
          .json({ error: 'There was an error while creating appointment.' });
    }
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const { startTime, duration, confirmed } = req.body;
    const appt = await query('SELECT * FROM appointments WHERE id = $1', [id]);
    if (!appt.rows || !appt.rows[0]) throw new Error(404);
    if (
      appt.rows[0].userId !== user.id &&
      appt.rows[0].contractorId !== user.contractorId
    )
      throw new Error(403);
    const userAppt = await query(
      'UPDATE appointments SET "startTime" = $1, duration = $2, confirmed = $3 WHERE id = $4 RETURNING *',
      [startTime, duration, confirmed, id]
    );
    return res.json({ updated: userAppt.rows[0] });
  } catch (err) {
    switch (err.message) {
      case '403':
        return res.status(403).json({ error: 'Forbidden' });
      case '404':
        return res
          .status(404)
          .json({ error: 'No appointment with that ID found.' });
      default:
        return res
          .status(500)
          .json({ error: 'There was an error while updating appointment.' });
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
    if (
      appt.rows[0].userId !== user.id &&
      appt.rows[0].contractorId !== user.contractorId
    )
      throw new Error(403);
    await query('DELETE FROM appointments WHERE id = $1', [id]);
    return res.json({ deleted: appt.rows[0] });
  } catch (err) {
    switch (err.message) {
      case '403':
        return res.status(403).json({ error: 'Forbidden' });
      case '404':
        return res
          .status(404)
          .json({ error: 'No appointment with that ID found.' });
      default:
        return res
          .status(500)
          .json({ error: 'There was an error while deleting appointment.' });
    }
  }
});

module.exports = router;
