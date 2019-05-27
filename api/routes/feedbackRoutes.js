const express = require('express');
const { query } = require('../../db');

const router = express.Router();

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await query(
      'SELECT * FROM feedback WHERE contractor_id = $1;',
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
    const userId = req.decoded.id;
    if (!stars || !message) throw new Error(400);
    const feedback = await query(
      `INSERT INTO feedback (user_id, contractor_id, stars, message)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_id, contractor_id, stars, message, created_at`,
      [userId, id, stars, message]
    );
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
