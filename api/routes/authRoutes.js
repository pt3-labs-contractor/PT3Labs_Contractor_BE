const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { query } = require('../../db');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const {
      username,
      password,
      phoneNumber,
      email,
      contractorName,
      streetAddress,
      city,
      stateAbbr,
      zipCode,
    } = req.body;
    if (!username || !password || !phoneNumber || !email) throw new Error(400);
    const hash = await bcrypt.hash(password, 12);
    let user;
    if (contractorName) {
      if (!streetAddress || !city || !stateAbbr || !zipCode)
        throw new Error('contractor 400');
      const contractor = await query(
        `INSERT INTO contractors (name, phone_number, street_address, city, state_abbr, zip_code)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id;`,
        [contractorName, phoneNumber, streetAddress, city, stateAbbr, zipCode]
      );
      user = await query(
        `INSERT INTO users (username, password, phone_number, email, contractor_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, username, phone_number, email, contractor_id, created_at;
        `,
        [username, hash, phoneNumber, email, contractor.rows[0].id]
      );
    } else {
      user = await query(
        `INSERT INTO users (username, password, phone_number, email)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, phone_number, email, created_at;`,
        [username, hash, phoneNumber, email]
      );
    }
    const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });
    return res.status(201).json({ token });
  } catch (err) {
    switch (err.message) {
      case '400':
        return res.status(400).json({
          error:
            'Request must includes values for username, password, phoneNumber, and email keys.',
        });
      case 'contractor 400':
        return res.status(400).json({
          error:
            'New contractor must include values for streetAddress, city, stateAbbr, and zipCode.',
        });
      default:
        return res
          .status(500)
          .json({ error: 'There was a problem while registering.' });
    }
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) throw new Error(400);
    const user = await query(`SELECT * FROM users WHERE username = $1`, [
      username,
    ]);
    if (!user.rows[0] || !user.rows[0].password) throw new Error();
    const valid = await bcrypt.compare(password, user.rows[0].password);
    if (!valid) throw new Error();
    const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });
    return res.json({ token });
  } catch (err) {
    switch (err.message) {
      case '400':
        return res.status(400).json({
          error: 'Request must include values for username and password.',
        });
      default:
        return res.status(401).json({ error: 'Unauthorized' });
    }
  }
});

router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile email'],
  })
);

router.get('/google/redirect', passport.authenticate('google'), (req, res) => {
  res.redirect(`http://localhost:3000/redirect/${req.user.token}`);
});

module.exports = router;
