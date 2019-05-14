require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const passport = require('passport');
const {
  contractorRoutes,
  userRoutes,
  schedulesRoutes,
  authRoutes,
} = require('./routes');
require('../config/passport-setup');

const app = express();

app.use(
  session({
    name: process.env.SESSION_NAME,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false, // When to get consent?  Give consent as part of Google consent screen?
    httpOnly: true,
    cookie: {
      maxAge: 1 * 24 * 60 * 60 * 1000,
      secure: false, // https only, ideally will be true in production
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use('/contractors', contractorRoutes);
app.use('/users', userRoutes);
app.use('/schedules', schedulesRoutes);
app.use('/auth', authRoutes);

module.exports = app;
