const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  try {
    const [bearer, token] = req.headers.authorization.split(' ');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.decoded = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = authenticate;
