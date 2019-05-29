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

beforeEach(async () => {
  const response = await request(server)
    .post('/api/auth/register')
    .send(testUser);
  ({ token } = response.body);
});

afterEach(async () => {
  await query('DELETE FROM users WHERE username = $1', [testUser.username]);
});

describe('User routes', () => {
  it("Should return authorized user's information", async () => {
    const response = await request(server)
      .get('/api/users')
      .set('authorization', `Bearer ${token}`);
    expect(response.body.user.username).toBe(testUser.username);
  });
  it('Should allow user to update their information', async () => {
    const response = await request(server)
      .put('/api/users')
      .send({ email: 'this_is_a_new_test_email@yes.com' })
      .set('authorization', `Bearer ${token}`);
    expect(response.body.user.email).toBe('this_is_a_new_test_email@yes.com');
  });
  it('Should return 400 BAD REQUEST if not provided any keys to update', async () => {
    const response = await request(server)
      .put('/api/users')
      .send({ notAKey: 'Should not work' })
      .set('authorization', `Bearer ${token}`);
    expect(response.status).toBe(400);
  });
  it('Should delete user on request', async () => {
    const response = await request(server)
      .del('/api/users')
      .set('authorization', `Bearer ${token}`);
    expect(response.body.deleted.username).toBe(testUser.username);
    const get = await request(server)
      .get('/api/users')
      .set('authorization', `Bearer ${token}`);
    expect(get.status).toBe(401);
  });
});

describe('Contractor routes', () => {
  it('Should display list of contractors on GET', async () => {
    const response = await request(server)
      .get('/api/contractors')
      .set('authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.contractors)).toBeTruthy();
  });
});
