require('dotenv').config();
const { Pool } = require('pg');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY_TEST);

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT,
  max: 20,
  idleTimeoutMillis: 0,
});

async function query(text, values) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(text, values);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    return error;
  } finally {
    await client.release();
  }
}

async function checkUserSubscriptions() {
  const entries = await query(
    'SELECT * FROM stripe WHERE "subscriptionId" IS NOT NULL;'
  );
  const subscribers = entries.rows;
  const promises = [];
  for (let i = 0; i < subscribers.length; i += 1) {
    promises.push(
      stripe.subscriptions
        .retrieve(subscribers[i].subscriptionId)
        .then(res => {
          if (res.status !== 'active') {
            promises.push(
              query(
                'UPDATE stripe SET "subscriptionId" = NULL WHERE "userId" = $1 AND "customerId" = $2;',
                [subscribers[i].userId, subscribers[i].customerId]
              )
            );
          }
        })
        .catch(err => {
          console.log(err);
          //   promises.push(
          //     query(
          //   'UPDATE stripe SET "subscriptionId" = NULL WHERE "userId" = $1 AND "customerId" = $2;',
          //   [subscribers[i].userId, subscribers[i].customerId]
          // )
          //   );
        })
    );
  }
  const finished = await Promise.all(promises);
  return finished;
}

checkUserSubscriptions()
  .then(() => pool.end())
  .catch(err => console.log(err));
