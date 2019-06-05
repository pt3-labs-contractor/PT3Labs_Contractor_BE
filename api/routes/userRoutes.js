const express = require('express');
const { query } = require('../../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { password, ...withoutPassword } = req.user;
    return res.json({ user: withoutPassword });
  } catch (err) {
      return res
        .status(500)
        .json({ error: 'There was a problem while retrieving user info.' });
    
  }
});

// get user by id as a callback
// Save just in case we need to use it
// router.get('/:id', async (req, res) => {
//   const { id } = req.params;
//   const user = await query('SELECT * FROM users where id= $1', [id]);
//   res.json({ user: user.rows[0] });
// });

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await query(
      'SELECT id, username, "phoneNumber", email, "contractorId", "createdAt" FROM users WHERE id = $1;',
      [id]
    );
    if (!user.rows || !user.rows[0]) {
      throw new Error(404);
    }
    return res.json({ user: user.rows[0] });
  } catch (error) {
    switch (error.message) {
      case '404':
        return res.status(404).json({ error: 'No user found with that ID.' });
      default:
        return res.status(500).json({ error: error.message });
    }
  }
});

// Post as a callback function

// router.post('/', (req, res) => {
//   const { googleId, username, phoneNumber, email, contractorId } = req.body;

//   query(
//     'INSERT INTO users (googleId, username, phoneNumber, email, contractorId) VALUES ($1, $2, $3, $4, $5) RETURNING *',
//     [googleId, username, phoneNumber, email, contractorId],
//     (error, result) => {
//       if (error) {
//         throw error;
//       }
//       res.status(201).send(`user added with ID: ${result.rows[0].id}`);
//     }
//   );
// });

// POST operation not needed, as adding users is handled through OAuth
// process or /api/auth/register, see authRoutes.

// router.post('/', async (req, res) => {
//   try {
//     const user = await query(
//       'INSERT INTO users (googleId, username, phoneNumber, email, contractorId) VALUES ($1, $2, $3, $4, $5) RETURNING *',
//       [
//         req.body.googleId,
//         req.body.username,
//         req.body.phoneNumber,
//         req.body.email,
//         req.body.contractorId,
//       ]
//     );
//     return res.json(user.rows[0]);
//   } catch (err) {
//     return err;
//   }
// });

router.put('/', async (req, res) => {
  function constructQueries(potentialKeys) {
    const queries = [];
    for (let i = 0; i < potentialKeys.length; i += 1) {
      if (potentialKeys[i][1]) {
        queries.push(
          query(
            `UPDATE users SET "${potentialKeys[i][0]}" = $1 WHERE id = $2`,
            [potentialKeys[i][1], req.user.id]
          )
        );
      }
    }
    return queries;
  }
  try {
    const { username, password, email, phoneNumber } = req.body;
    const potentialKeys = Object.entries({
      username,
      password,
      email,
      phoneNumber,
    });
    if (potentialKeys.every(key => !key[1])) {
      throw new Error(400);
    }
    const promises = constructQueries(potentialKeys);
    await Promise.all(promises);
    const updatedUser = await query(
      'SELECT id, username, "phoneNumber", email, "contractorId", "createdAt" FROM users WHERE id = $1',
      [req.user.id]
    );
    return res.json({ user: updatedUser.rows[0] });
  } catch (err) {
    switch (err.message) {
      case '400':
        return res.status(400).json({
          error:
            'Please indicate key to update (e.g. username, password, email, phoneNumber)',
        });
      default:
        return res.status(500).json({
          error: 'There was an error while updating user information',
        });
    }
  }
});

// Async/await. use this endpoint if the one below isnt working
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
router.delete('/', async (req, res) => {
  try {
    const { user } = req;
    const { password, ...withoutPassword } = user;
    if (user.contractorId) {
      // Delete will cascade to users table
      await query(`DELETE FROM contractors WHERE id = $1`, [user.contractorId]);
    } else {
      await query(`DELETE FROM users WHERE id = $1`, [user.id]);
    }
    return res.json({ deleted: withoutPassword });
  } catch (err) {
    return res
      .status(500)
      .json({ error: 'There was an error while trying to delete user.' });
  }
});

module.exports = router;
