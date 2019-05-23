const express = require('express');
const passport = require('passport');

const router = express.Router();

router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile email'],
  })
);

router.get('/google/redirect', passport.authenticate('google'), (req, res) => {
  console.log('GOT THROUGH', req.user);
  res.redirect(`http://localhost:3000/redirect/${req.user.token}`);
});

module.exports = router;
