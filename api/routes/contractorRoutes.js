const express = require('express');
const { query } = require('../../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const contractors = await query('SELECT * FROM contractors;');
    const promises = contractors.rows.map(async contractor => {
      const services = await query(
        'SELECT * FROM services WHERE "contractorId" = $1',
        [contractor.id]
      );
      const score = await getAverageScore(contractor.id);
      // let score = await query(
      //   'SELECT stars FROM feedback WHERE "contractorId" = $1',
      //   [contractor.id]
      // );
      // score = score.rows.reduce((acc, cur, index, arr) => {
      //   acc += cur.stars;
      //   if (index === arr.length - 1) {
      //     acc /= arr.length;
      //   }
      //   return acc;
      // }, 0);
      return { ...contractor, services: services.rows, userScore: score };
    });
    const contractorsWithServices = await Promise.all(promises);
    return res.json({ contractors: contractorsWithServices });
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
    if (!contractor.rows || !contractor.rows[0]) {
      throw new Error(404);
    }
    const services = await query(
      'SELECT * FROM services WHERE "contractorId" = $1',
      [contractor.rows[0].id]
    );
    const score = await getAverageScore(contractor.rows[0].id);
    return res.json({
      contractor: {
        ...contractor.rows[0],
        services: services.rows,
        userScore: score,
      },
    });
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
      'INSERT INTO contractors (name, "phoneNumber", "streetAddress", city, "stateAbbr", "zipCode") VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [contractorName, phoneNumber, streetAddress, city, stateAbbr, zipCode]
    );
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
  if (id !== req.user.contractorId) throw new Error(403);
  try {
    const contractor = await query(
      'UPDATE contractors SET name = $1, "phoneNumber" = $2, "streetAddress" = $3, city = $4, "stateAbbr" = $5, "zipCode" = $6 WHERE id= $7 RETURNING *',
      [
        req.body.name,
        req.body.phoneNumber,
        req.body.streetAddress,
        req.body.city,
        req.body.stateAbbr,
        req.body.zipCode,
        id,
      ]
    );
    return res.json({ contractor: contractor.rows[0] });
  } catch (error) {
    switch (error.message) {
      case '403':
        return res.status(403).json({ error: 'Forbidden' });
      case '404':
        return res
          .status(404)
          .json({ error: 'No contractor found with that ID.' });
      default:
        return res.status(500).json({ error: error.message });
    }
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.contractorId !== id) throw new Error(403);
    const contractor = await query(
      'DELETE FROM contractors WHERE id = $1 RETURNING *',
      [id]
    );
    if (!contractor.rows || !contractor.rows[0]) throw new Error(404);
    return res.json({ deleted: contractor.rows[0] });
  } catch (err) {
    switch (err.message) {
      case '403':
        return res.status(403).json({ error: 'Forbidden' });
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

async function getAverageScore(id) {
  let score = await query(
    'SELECT stars FROM feedback WHERE "contractorId" = $1',
    [id]
  );
  score = score.rows.reduce((acc, cur, index, arr) => {
    acc += cur.stars;
    if (index === arr.length - 1) {
      acc /= arr.length;
    }
    return acc;
  }, 0);
  return score;
}

module.exports = router;
