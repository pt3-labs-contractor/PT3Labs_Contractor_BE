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
  return next();
});

router.get('/', async (req, res) => {
  try {
    const { user } = req;
    const entry = await query('SELECT * FROM stripe WHERE "userId" = $1', [
      user.id,
    ]);
    if (!entry.rows || !entry.rows[0] || !entry.rows[0].subscriptionId)
      throw new Error(404);
    const subscription = await stripe.subscriptions.retrieve(
      entry.rows[0].subscriptionId
    );
    return res.json({ subscription });
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
    const { user } = req;
    const { token, address } = req.body;
    if (!token || !address) throw new Error(400);
    const existing = await query('SELECT * FROM stripe WHERE "userId" = $1', [
      user.id,
    ]);
    if (!existing.rows) throw new Error();
    if (existing.rows[0] && existing.rows[0].subscriptionId)
      throw new Error('existing');
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
    let success;
    if (existing.rows && existing.rows[0]) {
      // If customer information already exists in database
      const source = await stripe.sources.create({
        type: 'card',
        token: token.id,
        owner,
      });
      const added = await stripe.customers.createSource(
        existing.rows[0].customerId,
        {
          source: source.id,
        }
      );
      const subscription = await stripe.subscriptions.create({
        customer: existing.rows[0].customerId,
        items: [{ plan: process.env.STRIPE_PLAN_ID_TEST }],
      });
      success = await query(
        `UPDATE stripe
        SET "subscriptionId" = $1
        WHERE "userId" = $2
        RETURNING *;`,
        [subscription.id, user.id]
      );
    } else {
      // If customer information does not exist in database
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
      success = await query(
        `INSERT INTO stripe("subscriptionId", "customerId", "userId")
      VALUES($1, $2, $3)
      RETURNING *;`,
        [subscription.id, customer.id, user.id]
      );
    }
    if (!success.rows || !success.rows[0]) throw new Error();
    return res.status(201).json({ success: success.rows[0] });
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
    const { user } = req;
    const subscription = await query(
      'SELECT * FROM stripe WHERE "userId" = $1',
      [user.id]
    );
    if (
      !subscription.rows ||
      !subscription.rows[0] ||
      subscription.rows[0].subscriptionId === null
    )
      throw new Error(404);
    const scheduleDelete = await stripe.subscriptions.update(
      subscription.rows[0].subscriptionId,
      {
        cancel_at_period_end: true,
      }
    );
    return res.json({
      success: 'Subscription will not renew at end of current period.',
    });
  } catch (error) {
    switch (error.message) {
      case '404':
        return res
          .status(404)
          .json({ error: 'No active subscription listed for this account.' });
      default:
        return res.status(500).json({
          error: 'There was an error while attempting to delete subscription.',
        });
    }
  }
});

router.delete('/immediate', async (req, res) => {
  try {
    const { user } = req;
    const subscription = await query(
      'SELECT * FROM stripe WHERE "userId" = $1',
      [user.id]
    );
    if (
      !subscription.rows ||
      !subscription.rows[0] ||
      subscription.rows[0].subscriptionId === null
    )
      throw new Error(404);
    const scheduleDelete = await stripe.subscriptions.del(
      subscription.rows[0].subscriptionId
    );
    const setToNull = await query(
      `UPDATE stripe
      SET "subscriptionId" = NULL
      WHERE "userId" = $1
      RETURNING *;`,
      [user.id]
    );
    if (!setToNull.rows || !setToNull.rows[0]) throw new Error();
    return res.json({ success: setToNull.rows[0] });
  } catch (err) {
    switch (err.message) {
      case '404':
        return res
          .status(404)
          .json({ error: 'No active subscription listed for this account.' });
      default:
        return res.status(500).json({
          error: 'There was an error while attempting to delete subscription.',
        });
    }
  }
});

router.put('/payment', async (req, res) => {
  try {
    const { user } = req;
    const { token, address } = req.body;
    if (!token || !address) throw new Error(400);
    const existing = await query('SELECT * FROM stripe WHERE "userId" = $1', [
      user.id,
    ]);
    if (!existing.rows || !existing.rows[0]) throw new Error(404);
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
    const source = await stripe.sources.create({
      type: 'card',
      token: token.id,
      owner,
    });
    const added = await stripe.customers.createSource(
      existing.rows[0].customerId,
      {
        source: source.id,
      }
    );
    return res.json({ success: 'Payment source successfully changed.' });
  } catch (err) {
    switch (err.message) {
      case '400':
        return res.status(400).json({
          error: 'Request must include values for token and address keys.',
        });
      case '404':
        return res
          .status(404)
          .json({ error: 'No active subscription found for this account.' });
      default:
        return res.status(500).json({
          error: 'There was an error while attempting to update payment info.',
        });
    }
  }
});

module.exports = router;
