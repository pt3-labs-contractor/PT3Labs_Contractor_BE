require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
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
const SessionStore = new RedisStore({ port: 6379 });

app.use(
  session({
    store: SessionStore,
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
app.use(authenticate);
app.use(checkRequisiteUserInfo);
app.use('/api/contractors', contractorRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/appointments', appointmentRoutes);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}
module.exports = app;
