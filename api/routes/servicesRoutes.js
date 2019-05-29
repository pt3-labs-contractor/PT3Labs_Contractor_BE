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
    const service = await query(
      'INSERT INTO services (name, price, contractor_id) VALUES ($1, $2, $3) RETURNING *',
      [req.body.name, req.body.price, req.body_contractor_id]
    );
    return res.json(service.rows[0]);
  } catch (err) {
    return err;
  }
});

router.put('/:id', async (req, res) => {
  try {
    const service = await query(
      'UPDATE services SET name = ($1), price = ($2), contractor_id = ($3) WHERE id = ($4) RETURNING *',
      [req.body.phone_number, req.body.email, req.params.id]
    );
    return res.json({ services: service.rows[0] });
  } catch (err) {
    return err;
  }
});

// As a callback
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  query('DELETE FROM services WHERE id = $1', [id], error => {
    if (error) {
      throw error;
    }
    res.status(200).send(`Service deleted with id: ${id}`);
  });
});

module.exports = router;
