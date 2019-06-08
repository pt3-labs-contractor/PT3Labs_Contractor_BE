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
      try {
        // eslint-disable-next-line no-underscore-dangle
        const { email } = profile._json;
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
          return done(null, user);
        }
        const emailCheck = await query(
          'SELECT email FROM users WHERE email = $1',
          [email]
        );
        if (emailCheck.rows && emailCheck.rows[0])
          throw new Error('existing email');
        const newEntry = await query(
          `INSERT INTO users ("googleId", email)
        VALUES ($1, $2)
        RETURNING id, "googleId", username, "phoneNumber", email, "contractorId", "createdAt"`,
          [profile.id, email]
        );
        const token = jwt.sign(
          { id: newEntry.rows[0].id },
          process.env.JWT_SECRET,
          { expiresIn: '1d' }
        );
        const user = { ...newEntry.rows[0], token };
        return done(null, user);
      } catch (err) {
        switch (err.message) {
          case 'existing email':
            return done(null, { id: -1, error: 'existing email' });
          default:
            return done(null, { id: -1, error: 'error' });
        }
      }
    }
  )
);
