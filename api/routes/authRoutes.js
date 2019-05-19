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
  console.log('GOT THE INFO: ', req.user);
  res.redirect('http://localhost:3000');
});

module.exports = router;
