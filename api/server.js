require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const passport = require('passport');
const {
  contractorRoutes,
  userRoutes,
  schedulesRoutes,
  authRoutes,
  appointmentRoutes,
  servicesRoutes,
  feedbackRoutes,
  subscriptionRoutes,
} = require('./routes');
const { authenticate } = require('./middleware');
require('../config/passport-setup');

const app = express();

app.use(passport.initialize());
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use('/api/auth', authRoutes);
// app.use('/api', authenticate );
app.use('/api/users', userRoutes);
// app.use('/api', checkRequisiteUserInfo);
app.use('/api/contractors', contractorRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/subscription', subscriptionRoutes);

module.exports = app;
