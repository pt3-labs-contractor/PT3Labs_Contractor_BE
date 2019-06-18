const express = require('express');
const { query } = require('../../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { user } = req;
    let feedback;
    if (user.contractorId) {
      const result = await query(
        `SELECT f.id, c.name as "contractorName", username, stars, message, f."createdAt", f."contractorId", f."userId" FROM feedback f
        JOIN contractors c
        ON f."contractorId" = c.id
        JOIN users u
        ON f."userId" = u.id
        WHERE f."contractorId" = $1;`,
        [user.contractorId]
      );
      if (!result.rows) throw new Error();
      feedback = result.rows;
    } else {
      const result = await query(
        `SELECT f.id, c.name as "contractorName", stars, message, f."createdAt", f."contractorId", f."userId" FROM feedback f
        JOIN contractors c
        ON f."contractorId" = c.id
        WHERE f."userId" = $1;`,
        [user.id]
      );
      if (!result.rows) throw new Error();
      feedback = result.rows.map(x => {
        return { ...x, username: user.username };
      });
    }
    console.log(feedback);
    return res.json({ feedback });
  } catch (err) {
    return res
      .status(500)
      .json({ error: 'There was an error while retrieving feedback.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await query(
      'SELECT * FROM feedback WHERE contractorId = $1;',
      [id]
    );
    res.json({ feedback: feedback.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { stars, message } = req.body;
    const userId = req.user.id;
    if (!stars || !message) throw new Error(400);
    const feedback = await query(
      `INSERT INTO feedback ("userId", "contractorId", stars, message)
      VALUES ($1, $2, $3, $4)
      RETURNING id, "userId", "contractorId", stars, message, "createdAt"`,
      [userId, id, stars, message]
    );
    console.log(feedback);
    if (!feedback.rows || !feedback.rows[0]) throw new Error();
    return res.status(201).json({ feedback: feedback.rows[0] });
  } catch (err) {
    switch (err.message) {
      case '400':
        return res.status(400).json({
          error: 'Request must include values for stars and message keys.',
        });
      default:
        return res.status(500).json({ error: err.message });
    }
  }
});

module.exports = router;
