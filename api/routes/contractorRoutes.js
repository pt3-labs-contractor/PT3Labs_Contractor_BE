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

router.post('/', async (req, res) => {
  try {
    const {
      contractorName,
      phoneNumber,
      streetAddress,
      city,
      stateAbbr,
      zipCode,
    } = req.body;
    // const { id } = req.decoded;
    if (
      !contractorName ||
      !phoneNumber ||
      !streetAddress ||
      !city ||
      !stateAbbr ||
      !zipCode
    )
      throw new Error(400);
    const contractor = await query(
      'INSERT INTO contractors (name, phone_number, street_address, city, state_abbr, zip_code) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [contractorName, phoneNumber, streetAddress, city, stateAbbr, zipCode]
    );
    // await query(`UPDATE users SET contractor_id = $1 WHERE id = $2;`, [
    //   contractor.rows[0].id,
    //   id,
    // ]);
    return res.status(201).json(contractor.rows[0]);
  } catch (err) {
    switch (err.message) {
      case '400':
        return res.status(400).json({
          error:
            'Request must includes values for contractorName, phoneNumber, streetAddress, city, stateAbbr, and zipCode keys.',
        });
      default:
        return res.status(500).json({
          error: 'There was an error while attempting to add contractor.',
        });
    }
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const contractor = await query(
      'UPDATE contractors SET name = $1, phone_number = $2, street_address = $3, city = $4, state_abbr = $5, zip_code = $6 WHERE id= $7 RETURNING *',
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
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const contractor = await query(
      'DELETE FROM contractors WHERE id = $1 RETURNING *',
      [id]
    );
    if (!contractor.rows || !contractor.rows[0]) throw new Error(404);
    return res.json({ deleted: contractor.rows[0] });
  } catch (err) {
    switch (err.message) {
      case '404':
        return res
          .status(404)
          .json({ error: 'No contractor by that ID found.' });
      default:
        return res.status(500).json({
          error: 'There was an error while attempting to delete contractor.',
        });
    }
  }
});

module.exports = router;
