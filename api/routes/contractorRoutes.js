const express = require('express');
const axios = require('axios');
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

router.get('/zip/:zip', async (req, res) => {
  function isCenterOfUS(lat, long) {
    return lat === '39.495914459228516' && long === '-98.98998260498047';
  }
  async function haversine(zip, strLat2, strLong2) {
    const response = await axios.get(
      `https://dev.virtualearth.net/REST/v1/Locations?countryRegion=US&postalCode=${zip}&key=${process.env.BING_MAPS_KEY}`
    );
    if (!response.data.resourceSets[0].resources.length) throw new Error(400);
    const [
      lat1,
      long1,
    ] = response.data.resourceSets[0].resources[0].point.coordinates;
    if (isCenterOfUS(lat1, long1)) throw new Error(400);
    const [lat2, long2] = [Number(strLat2), Number(strLong2)];
    const toRad = n => (n * Math.PI) / 180;
    const [dLat, dLong] = [toRad(lat2 - lat1), toRad(long2 - long1)];
    const R = 6371; // Earth's radius
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLong / 2) *
        Math.sin(dLong / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(4);
  }
  try {
    const { zip } = req.params;
    const result = await query('SELECT * FROM contractors;');
    const promises = result.rows.map(async contractor => {
      if (
        !contractor.latitude ||
        isCenterOfUS(contractor.latitude, contractor.longitude)
      ) {
        return contractor;
      }
      const distance = await haversine(
        zip,
        contractor.latitude,
        contractor.longitude
      );
      return { ...contractor, distance };
    });
    const contractors = await Promise.all(promises);
    return res.json({
      contractors: contractors.sort((a, b) => {
        if (!a.distance) return 1;
        if (!b.distance) return -1;
        return a.distance - b.distance;
      }),
    });
  } catch (err) {
    return res
      .status(500)
      .json({ error: 'There was an error while retrieving contractors.' });
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

// Note: Use this one if the one above doesnt work
// router.put('/:id', async (req, res) => {
//   try {
//     const contractor = await query(
//       'UPDATE contractors SET name = ($1), phoneNumber = ($2), streetAddress = ($3), city = ($4), stateAbbr = ($5), zipCode = ($6) WHERE id = ($7) RETURNING *',
//       [
//         req.body.name,
//         req.body.phoneNumber,
//         req.body.streetAddress,
//         req.body.city,
//         req.body.stateAbbr,
//         req.body.zipCode,
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
//   const {name, phoneNumber, streetAddress, city, stateAbbr, zipCode} = request.body};

//   query(
//   'UPDATE contractors SET name = $1, phoneNumber = $2, streetAddress = $3, city = $4, stateAbbr = $5, zipCode = $6 WHERE id = $7',
//   [name, phoneNumber, streetAddress, city, stateAbbr, zipCode],
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

module.exports = router;
