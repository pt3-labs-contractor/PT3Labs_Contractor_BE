const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY_TEST);

const { query } = require('../../db');

router.use((req, res, next) => {
  if (!req.user.contractorId)
    return res.status(403).json({
      error:
        "Subscriptions only hold benefits for contractor accounts.  If you'd like to support us, please reach out to us about donations.",
    });
  next();
});

router.get('/', async (req, res) => {
  try {
    const id = req.user.subscriptionId;
    if (!id) throw new Error(404);
    const subscription = await stripe.subscriptions.retrieve(id);
    res.json({ subscription });
  } catch (error) {
    switch (error.message) {
      case '404':
        return res
          .status(404)
          .json({ error: 'No active subscription detected.' });
      default:
        return res
          .status(500)
          .json({ error: 'There was an error while retrieving subscription.' });
    }
  }
});

router.post('/', async (req, res) => {
  try {
    const { token, address } = req.body;
    if (!token || !address) throw new Error(400);
    if (req.user.subscriptionId) throw new Error('existing');
    if (address.billing_address_country_code !== 'US')
      throw new Error('non-US');
    const owner = {
      name: address.billing_name,
      address: {
        line1: address.billing_address_line1,
        city: address.billing_address_city,
        postal_code: address.billing_address_zip,
        country: address.billing_address_country_code,
      },
      email: token.email,
    };
    const customer = await stripe.customers.create(owner);
    const source = await stripe.sources.create({
      type: 'card',
      token: token.id,
      owner,
    });
    const added = await stripe.customers.createSource(customer.id, {
      source: source.id,
    });
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ plan: process.env.STRIPE_PLAN_ID_TEST }],
    });
    const query = await query(
      `UPDATE users 
      SET "subscriptionId" = $1 
      WHERE id = $2
      RETURNING id, username, "googleId", email, "phoneNumber", "contractorId", "subscriptionId", "createdAt";`,
      [subscription.id, req.user.id]
    );
    if (!query.rows || !query.rows[0]) throw new Error();
    return res.status(201).json({ success: query.rows[0] });
  } catch (error) {
    switch (error.message) {
      case '400':
        return res.status(400).json({
          error: 'Request must includes values for token and address keys.',
        });
      case 'non-US':
        return res.status(403).json({
          error:
            'Contractor Scheduler services not currently available outside of the United States.',
        });
      case 'existing':
        return res.status(403).json({
          error:
            'This account is already associated with an active subscription.  Please retrieve information for this subscription, or cancel subscription to create a new one.',
        });
      default:
        return res.status(500).json({
          error: 'There was an error while initializing subscription.',
        });
    }
  }
});

router.delete('/', async (req, res) => {
  try {
    const id = req.user.subscriptionId;
    if (!id) throw new Error(404);
    const deleted = await stripe.subscriptions.del(id);
    const query = await query(
      `UPDATE users
    SET "subscriptionId" = NULL
    WHERE id = $1
    RETURNING id, username, "googleId", email, "phoneNumber", "contractorId", "subscriptionId", "createdAt";`,
      [req.user.id]
    );
    if (!query.rows || !query.rows[0]) {
      throw new Error();
    }
    res.json({ success: query.rows[0] });
  } catch (error) {}
});

module.exports = router;
