const express = require('express');
const { query } = require('../../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const services = await query('SELECT * FROM services');
    return res.json({ services: services.rows });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Async/await
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const services = await query('SELECT * FROM services WHERE id = $1', [id]);
    if (!services.rows || !services.rows.length) {
      throw new Error(404);
    }
    return res.json({ services: services.rows });
  } catch (error) {
    switch (error.message) {
      case '404':
        return res
          .status(404)
          .json({ error: 'No service with that ID found.' });
      default:
        return res.status(500).json({ error: error.message });
    }
  }
});

router.get('/contractor/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const services = await query(
      'SELECT * FROM services WHERE "contractorId" = $1',
      [id]
    );
    if (!services.rows) {
      throw new Error(404);
    }
    return res.json({ services: services.rows });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// // GET service by id as a promise.
// router.get('/:id', (req, res) => {
//   const { id } = req.params;
//   query('SELECT * FROM services WHERE id = $1', [id])
//     .then(service => {
//       res.status(200).json({
//         status: 'success',
//         service,
//         message: 'Retrieved ONE service',
//       });
//     })
//     .catch(err => {
//       return err;
//     });
// });

router.post('/', async (req, res) => {
  try {
    const { id } = req.decoded;
    const user = await query('SELECT "contractorId" FROM users WHERE id = $1', [
      id,
    ]);
    if (!user.rows[0].contractorId) {
      throw new Error(403);
    }
    const service = await query(
      'INSERT INTO services (name, price, "contractorId") VALUES ($1, $2, $3) RETURNING *',
      [req.body.name, req.body.price, user.rows[0].contractorId]
    );
    return res.status(201).json({ created: service.rows[0] });
  } catch (err) {
    switch (err.message) {
      case '403':
        return res
          .status(403)
          .json({ error: 'User account cannot create new services.' });
      default:
        return res
          .status(500)
          .json({ error: 'There was a problem while creating new service.' });
    }
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await query('SELECT "contractorId" FROM users WHERE id = $1', [
      req.decoded.id,
    ]);
    const service = await query('SELECT * FROM services WHERE id = $1', [id]);
    if (!service.rows || !service.rows[0]) {
      throw new Error(404);
    }
    if (service.rows[0].contractorId !== user.rows[0].contractorId) {
      throw new Error(403);
    }
    const updated = await query(
      'UPDATE services SET name = $1, price = $2, "contractorId" = $3 WHERE id = $4 RETURNING *',
      [req.body.name, req.body.price, user.rows[0].contractorId, id]
    );
    return res.json({ updated: updated.rows[0] });
  } catch (err) {
    switch (err.message) {
      case '403':
        return res.status(403).json({ error: 'Forbidden' });
      case '404':
        return res
          .status(404)
          .json({ error: 'No service found with that ID.' });
      default:
        return res.status(500).json({ error: err.message });
    }
  }
});

// As a callback
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await query('SELECT "contractorId" from users WHERE id = $1', [
      req.decoded.id,
    ]);
    const service = await query('SELECT * from services WHERE id = $1', [id]);
    if (!service.rows || !service.rows[0]) {
      throw new Error(404);
    }
    if (user.rows[0].contractorId !== service.rows[0].contractorId) {
      throw new Error(403);
    }
    await query('DELETE FROM services WHERE id = $1', [id]);
    return res.json({ deleted: service.rows[0] });
  } catch (err) {
    switch (err.message) {
      case '403':
        return res.status(403).json({ error: 'Forbidden' });
      case '404':
        return res
          .status(404)
          .json({ error: 'No service with that ID found.' });
      default:
        return res.status(500).json({
          error: 'There was a problem while trying to delete service.',
        });
    }
  }
});

module.exports = router;
