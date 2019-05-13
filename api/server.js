require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { contractorRoutes, userRoutes, schedulesRoutes } = require('./routes');

const app = express();

app.use(cors());
app.use(helmet());
app.use('/contractors', contractorRoutes);
app.use('/users', userRoutes);
app.use('/schedules', schedulesRoutes);

module.exports = app;
