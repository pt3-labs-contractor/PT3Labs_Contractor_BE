require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const passport = require('passport');
const {
  contractorRoutes,
  userRoutes,
  schedulesRoutes,
  authRoutes,
  appointmentRoutes,
  servicesRoutes,
} = require('./routes');
const { authenticate, checkRequisiteUserInfo } = require('./middleware');
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
app.use('/api/auth', authRoutes);
app.use('/api', authenticate);
app.use('/api/users', userRoutes);
app.use('/api', checkRequisiteUserInfo);
app.use('/api/contractors', contractorRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/appointments', appointmentRoutes);

app.use(express.static('client/build'));
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../', 'client', 'build', 'index.html'));
});

module.exports = app;
