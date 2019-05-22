function authenticate(req, res, next){
  console.log(req.session);
  if (req.session && req.session.passport) next()
  else res.status(401).json({ error: 'Unauthenticated' });
}

module.exports = authenticate;