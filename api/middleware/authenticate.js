const jwt = require('jsonwebtoken');
const { query } = require('../../db');

function authenticate(req, res, next) {
  const token = req.headers.authorization.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(401).json({ error: 'Unauthorized' });
    } else {
      req.decoded = decoded;
      next();
    }
  });
}

module.exports = authenticate;
