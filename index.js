require('dotenv').config();
const express = require('express');
const app = express();
const { handleDBConnect } = require('./db');

handleDBConnect();

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server listening on port ${port}.`));