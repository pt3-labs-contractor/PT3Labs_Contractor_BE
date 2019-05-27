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

// As a promise. please leave it as comment out
// router.get('/', (req, res, next) => {
//   query('SELECT * FROM contractors')
//     .then(contractors => {
//       res.status(200).json({
//         status: 'success',
//         contractors,
//         message: 'Retrieved All contractors',
//       });
//     })
//     .catch(err => {
//       return next(err);
//     });
// });

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

// Post as callback func
// Will write it later

router.post('/', async (req, res) => {
  try {
    const contractor = await query(
      'INSERT INO contractors (name, phone_number, street_address, city, state_abbr, zip_code) VALUES ($1, $2, $3, $4, $5, $6) RETURNING*',
      [
        req.body.name,
        req.body.phone_number,
        req.body.street_address,
        req.body.city,
        req.body.state_abbr,
        req.body.zip_code,
      ]
    );
    return res.json(contractor.rows[0]);
  } catch (err) {
    return err;
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const contractor = await query(
      'UPDATE contractors SET name = ($1), phone_number = ($2), street_address = ($3), city = ($4), state_abbr = ($5), zip_code = ($6) WHERE id= ($7) RETURNING *',
      [
        req.body.name,
        req.body.phone_number,
        req.body.street_address,
        req.body.city,
        req.body.state_abbr,
        req.body.zip_code,
        id,
      ]
    );
    return res.json({ contractor: contractor.rows[0] });
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

// Note: Use this one if the one above doesnt work
// router.put('/:id', async (req, res) => {
//   try {
//     const contractor = await query(
//       'UPDATE contractors SET name = ($1), phone_number = ($2), street_address = ($3), city = ($4), state_abbr = ($5), zip_code = ($6) WHERE id = ($7) RETURNING *',
//       [
//         req.body.name,
//         req.body.phone_number,
//         req.body.street_address,
//         req.body.city,
//         req.body.state_abbr,
//         req.body.zip_code,
//         req.params.id,
//       ]
//     );
//     return res.json(contractor.rows[0]);
//   } catch (err) {
//     return err;
//   }
// });

// As a callback. Note:  save for back up endpoint
// router.put('/:id', (req, res) => {
//   const id = parseInt(req.params.id);
//   const {name, phone_number, street_address, city, state_abbr, zip_code} = request.body};

//   query(
//   'UPDATE contractors SET name = $1, phone_number = $2, street_address = $3, city = $4, state_abbr = $5, zip_code = $6 WHERE id = $7',
//   [name, phone_number, street_address, city, state_abbr, zip_code],
//   (error, result) => {
//     if (error) {
//       throw error
//     }
//     res.status(200).send(`contractor modified with ID: ${id}`)
//   }
//   )
// });

// As a callback
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  query('DELETE FROM contractors WHERE id = $1', [id], (err, res) => {
    if (err) {
      throw err;
    }
    res.status(200).send(`contractor deleted with id: ${id}`);
  });
});

module.exports = router;
