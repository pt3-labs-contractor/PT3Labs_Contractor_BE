const express = require('express');
const { query } = require('../../db');

const router = express.Router();

router.get('/', async (req, res) => {
  const users = await query(
    `SELECT id, username, phone_number, email, contractor_id, created_at FROM users
    WHERE id = $1`,
    [req.session.passport.user]
  );
  res.json({ users: users.rows });
});

module.exports = router;
