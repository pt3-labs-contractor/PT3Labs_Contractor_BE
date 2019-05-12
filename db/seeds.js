const faker = require('faker');
const bcrypt = require('bcrypt');
const { query } = require('.');

function contractorSeeds() {
  query('DELETE FROM contractors;');
  for (let i = 0; i < 500; i += 1) {
    query(
      `
          INSERT INTO contractors (name, phone_number, street_address, city, state_abbr, zip_code)
          VALUES ($1, $2, $3, $4, $5, $6);
        `,
      [
        faker.company.companyName(),
        faker.phone.phoneNumber(),
        faker.address.streetAddress(),
        faker.address.city(),
        faker.address.stateAbbr(),
        faker.address.zipCode(),
      ]
    );
  }
}

async function userSeeds() {
  query('DELETE FROM users;');
  const contractors = await query('SELECT * FROM contractors;');
  for (let i = 0; i < contractors.rows.length; i += 1) {
    const username = contractors.rows[i].name.replace(/\s/g, '') + i; // Add index, to be sure there are no repeating usernames
    const password = await new Promise((resolve, reject) => {
      bcrypt.hash('password', 10, (err, hash) => {
        if (err) reject(err);
        resolve(hash);
      });
    });
    const email = `${username}@email.com`;
    query(
      `
      INSERT INTO users ( username, password, email, contractor_id)
      VALUES ( $1, $2, $3, $4);
    `,
      [username, password, email, contractors.rows[i].id]
    );
  }
}

module.exports = {
  contractorSeeds,
  userSeeds,
};
