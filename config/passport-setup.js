require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20');
const jwt = require('jsonwebtoken');
const { query } = require('../db');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  query('SELECT * FROM users WHERE id = $1', [id])
    .then(result => done(null, result.rows[0]))
    .catch(err => {
      throw new Error(err);
    });
});

passport.use(
  new GoogleStrategy(
    {
      callbackURL: `/api/auth/google/redirect`,
      clientID: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo',
    },
    async (accessToken, refreshToken, profile, done) => {
      // Callback
      const response = await query(
        'SELECT * FROM users WHERE "googleId" = $1',
        [profile.id]
      );
      if (response.rows.length) {
        const token = jwt.sign(
          { id: response.rows[0].id },
          process.env.JWT_SECRET,
          { expiresIn: '1d' }
        );
        const user = { ...response.rows[0], token };
        done(null, user);
      } else {
        const newEntry = await query(
          `INSERT INTO users ("googleId")
          VALUES ($1)
          RETURNING id, "googleId", username, "phoneNumber", email, "contractorId", "createdAt"`,
          [profile.id]
        );
        const token = jwt.sign(
          { id: newEntry.rows[0].id },
          process.env.JWT_SECRET,
          { expiresIn: '1d' }
        );
        const user = { ...newEntry.rows[0], token };
        done(null, user);
      }
    }
  )
);
