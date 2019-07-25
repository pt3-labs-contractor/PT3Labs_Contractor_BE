const express = require('express');
const axios = require('axios');
const { query } = require('../../db');

const router = express.Router();

async function getAverageScore(id) {
  const reviews = await query(
    'SELECT stars FROM feedback WHERE "contractorId" = $1',
    [id]
  );
  if (!reviews.rows) throw new Error(500);
  const sum = reviews.rows.reduce((a, b) => a + b.stars, 0);
  const avg = sum / reviews.rows.length;
  return Math.round((avg * 10) / 10);
}

router.get('/', async (req, res) => {
  try {
    const contractors = await query('SELECT * FROM contractors;');
    const promises = contractors.rows.map(async contractor => {
      const services = await query(
        'SELECT * FROM services WHERE "contractorId" = $1',
        [contractor.id]
      );
      const score = await getAverageScore(contractor.id);
      return { ...contractor, services: services.rows, userScore: score };
    });
    const contractorsWithServices = await Promise.all(promises);
    return res.json({ contractors: contractorsWithServices });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

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

router.get('/zip/:zip', async (req, res) => {
  try {
    async function sortByDistance(zip, contractors, limit) {
      function isCenterOfUS(lat, long) {
        return (
          (lat === '39.495914459228516' && long === '-98.98998260498047') ||
          (lat === 39.495914459228516 && long === -98.98998260498047)
        );
      }
      function haversine(strLat1, strLong1, strLat2, strLong2) {
        const [lat1, long1, lat2, long2] = [
          Number(strLat1),
          Number(strLong1),
          Number(strLat2),
          Number(strLong2),
        ];
        const toRad = n => (n * Math.PI) / 180;
        const [dLat, dLong] = [toRad(lat2 - lat1), toRad(long2 - long1)];
        const R = 6371; // Earth's radius, in KM
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLong / 2) *
            Math.sin(dLong / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      }
      const response = await axios.get(
        `https://dev.virtualearth.net/REST/v1/Locations?countryRegion=US&postalCode=${zip}&key=${process.env.REACT_APP_BING_MAPS_KEY}`
      );
      if (!response.data.resourceSets[0].resources.length) return null;
      const [
        lat,
        long,
      ] = response.data.resourceSets[0].resources[0].point.coordinates;
      if (isCenterOfUS(lat, long)) return null;
      const promises = contractors.map(async contractor => {
        if (
          !contractor.latitude ||
          isCenterOfUS(contractor.latitude, contractor.longitude)
        )
          return contractor;
        return {
          ...contractor,
          distance:
            haversine(lat, long, contractor.latitude, contractor.longitude) *
            0.621371, // Convert to miles
        };
      });
      const resolved = await Promise.all(promises);
      const sorted = resolved.sort((a, b) => {
        if (!a.distance) return 1;
        if (!b.distance) return -1;
        return a.distance - b.distance;
      });
      return limit
        ? sorted.filter(contractor => limit > contractor.distance)
        : sorted;
    }
    const { zip } = req.params;
    const { contractors, limit } = req.body;
    const sortedContractors = await sortByDistance(zip, contractors, limit);
    return res.json({ contractors: sortedContractors });
  } catch (error) {
    return res
      .status(500)
      .json({ error: 'There was a problem while sorting contractors.' });
  }
});

module.exports = router;
