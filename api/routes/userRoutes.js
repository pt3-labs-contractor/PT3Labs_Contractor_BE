const express = require('express');
const { query } = require('../../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    return res.json({ user: req.user });
  } catch (err) {
    return res
      .status(500)
      .json({ error: 'There was a problem while retrieving user info.' });
  }
});

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
    const { username, password, email, phoneNumber, contractorId } = req.body;
    const potentialKeys = Object.entries({
      username,
      password,
      email,
      phoneNumber,
      contractorId,
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

router.delete('/', async (req, res) => {
  try {
    const { user } = req;
    if (user.contractorId) {
      // Delete will cascade to users table
      await query(`DELETE FROM contractors WHERE id = $1`, [user.contractorId]);
    } else {
      await query(`DELETE FROM users WHERE id = $1`, [user.id]);
    }
    return res.json({ deleted: user });
  } catch (err) {
    return res
      .status(500)
      .json({ error: 'There was an error while trying to delete user.' });
  }
});

module.exports = router;
