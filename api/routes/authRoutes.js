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
  res.redirect('/');
});

router.get('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err)
        return res.status(500).json({ error: 'Error while logging out.' });
      return res.redirect('/');
    });
  }
});

module.exports = router;
