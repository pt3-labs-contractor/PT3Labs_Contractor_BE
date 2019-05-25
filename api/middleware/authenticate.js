const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.decoded = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = authenticate;
