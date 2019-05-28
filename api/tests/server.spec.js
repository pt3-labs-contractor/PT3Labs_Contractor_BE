const request = require('supertest');
const server = require('../server');
const { query } = require('../../db');

const testUser = {
  username: 'TEST_USER',
  password: 'TEST_PASSWORD',
  email: 'TEST_EMAIL@email.com',
  phone_number: '(555) 555-5555',
};
let token;

beforeAll(async () => {
  const response = await request(server)
    .post('/api/auth/register')
    .send(testUser);
  ({ token } = response.body);
});

afterAll(async () => {
  await query('DELETE FROM users WHERE username = $1', [testUser.username]);
});

describe('User routes', () => {
  it("Should return authorized user's information", async () => {
    const response = await request(server)
      .get('/api/users')
      .set('authorization', `Bearer ${token}`);
    expect(response.body.users[0].username).toBe(testUser.username);
  });
});
