require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20');
const { query } = require('../db');

passport.use(
  new GoogleStrategy(
    {
      callbackURL: '/auth/google/redirect',
      clientID: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    },
    (accessToken, refreshToken, profile, done) => {
      // Callback
      console.log(Object.keys(profile));
      done();
    }
  )
);
