const express = require('express');
const { query } = require('../../db');

const router = express.Router();

router.get('/', async (req, res) => {
  const users = await query(
    `SELECT id, username, phone_number, email, contractor_id, created_at FROM users
    WHERE id = $1`,
    [req.decoded.id]
  );
  res.json({ users: users.rows });
});

// Get user by id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const user = await query(`SELECT FROM * users WHERE id=$1`, [id]);
  res.json({ users: user.row[0] });
});

// router.put('/:id', (req, res) => {
//   const {id} = req.params
//   const {name, email, }
// })

router.delete('/', async (req, res) => {
  const { id } = req.params; // req.decoded
  const user = await query(`DELETE FROM users WHERE id=$1`, [id]);
  res.json({ users: user.row[0] });
});

module.exports = router;
