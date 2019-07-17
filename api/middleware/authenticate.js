const jwt = require('jsonwebtoken');
const { query } = require('../../db');

async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await query('SELECT * FROM users WHERE id = $1', [decoded.id]);
    if (!user.rows || !user.rows[0]) {
      throw new Error();
    }
    const subscription = await query(
      'SELECT * FROM stripe WHERE "userId" = $1',
      [decoded.id]
    );
    if (!subscription.rows) throw new Error();
    const { password, ...withoutPassword } = user.rows[0];
    withoutPassword.subscriptionId = subscription.rows[0]
      ? subscription.rows[0].subscriptionId
      : null;
    req.user = withoutPassword;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = authenticate;
