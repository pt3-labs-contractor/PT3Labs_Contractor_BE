require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const {
  contractorRoutes,
  userRoutes,
  schedulesRoutes,
  authRoutes,
} = require('./routes');
require('../config/passport-setup');

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use('/contractors', contractorRoutes);
app.use('/users', userRoutes);
app.use('/schedules', schedulesRoutes);
app.use('/auth', authRoutes);

module.exports = app;
