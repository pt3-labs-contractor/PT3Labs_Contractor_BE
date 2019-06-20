require('dotenv').config();
const express = require('express');
const Twilio = require('twilio');

const router = express.Router();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_ACCOUNT_TOKEN;

const client = new Twilio(accountSid, authToken);

router.get('/send-text', (req, res) => {
  client.messages
    .create({
      to: process.env.MY_PHONE_NUMBER,
      from: '+18582521716',
      body:
        'Someone booked an appointment! Please log into your account and confirm',
    })
    .then(message => console.log(message.body));
});

module.exports = router;
