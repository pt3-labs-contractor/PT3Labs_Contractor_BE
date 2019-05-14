require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20');
const { query } = require('../db');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Next step - set up session w/ Express Session

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
      callbackURL: '/auth/google/redirect',
      clientID: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    },
    async (accessToken, refreshToken, profile, done) => {
      // Callback
      const response = await query('SELECT * FROM users WHERE google_id = $1', [
        profile.id,
      ]);
      if (response.rows.length) {
        console.log('User already registered!');
        console.log(response.rows[0]);
        done(null, response.rows[0]);
      } else {
        const newEntry = await query(
          `INSERT INTO users (google_id, username, phone_number, email)
          VALUES ($1, $2, $3, $4)
          RETURNING id, google_id, username, phone_number, email, contractor_id, created_at`,
          [
            profile.id,
            'NEW_TEST_USER',
            '(555) 555-5555',
            'NEW_TEST_EMAIL@email.com',
          ]
        );
        console.log('User creation successful!');
        console.log(newEntry.rows[0]);
        done(null, newEntry.rows[0]);
      }
    }
  )
);
