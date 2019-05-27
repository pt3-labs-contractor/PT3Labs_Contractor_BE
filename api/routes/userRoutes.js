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

router.get('/:id', async (req, res) => {
  const user = await query('SELECT * FROM users where id= $1', [id]);
  res.json({ users: users.rows });
});

router.post('/', async (req, res) => {
  try {
    const user = await query(
      'INSERT INTO users (google_id, username, phone_number, email, contractor_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [
        req.body.google_id,
        req.body.username,
        req.body.phone_number,
        req.body.email,
        req.body_contractor_id,
      ]
    );
    return res.json(user.rows[0]);
  } catch (err) {
    return err;
  }
});

router.update('/:id', async (req, res) => {
  try {
    const user = await query(
      'UPDATE users SET phone_number = ($1), email = ($2) WHERE id = ($3) RETURNING *',
      [req.body.phone_number, req.body.email, req.params.id]
    );
    return res.json(user.rows[0]);
  } catch (err) {
    return err;
  }
});

// Asyn/await. use this endpoint if the one below isnt working
// router.delete('/:id', async (req, res) => {
//   try {
//     const user = await query('DELETE FROM users WHERE id = $1', [
//       req.params.id,
//     ]);
//     return res.json({ message: `${user} deleted` });
//   } catch (err) {
//     return err;
//   }
// });

// As a callback
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  query('DELETE FROM users WHERE id = $1', [id], (err, res) => {
    if (err) {
      throw err;
    }
    res.status(200).send(`user deleted with id: ${id}`);
  });
});

module.exports = router;
