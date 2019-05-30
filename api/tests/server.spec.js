const request = require('supertest');
const server = require('../server');
const { query } = require('../../db');

const testUser = {
  username: 'TEST_USER',
  password: 'TEST_PASSWORD',
  email: 'TEST_EMAIL@email.com',
  phone_number: '(555) 555-5555',
};

const testContractor = {
  name: 'TEST_CONTRACTOR_INC',
  phone_number: '(555) 555-5555',
  street_address: '123 TEST ST.',
  city: 'TEST_CITY',
  state_abbr: 'TE',
  zip_code: '55555',
};

let token;

beforeEach(async () => {
  const response = await request(server)
    .post('/api/auth/register')
    .send({ ...testUser, ...testContractor });
  console.log(response);
  ({ token } = response.body);
});

afterEach(async () => {
  await query(`DELETE FROM contractors WHERE name = $1;`, [
    testContractor.name,
  ]);
});

describe('User routes', () => {
  it("Should return authorized user's information", async () => {
    const response = await request(server)
      .get('/api/users')
      .set('authorization', `Bearer ${token}`);
    expect(response.body.user.username).toBe(testUser.username);
    expect(response.body.user.contractor_id).toBeTruthy();
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
  it('Should not display information for a non-authenticated user', async () => {
    const response = await request(server).get('/api/users');
    expect(response.status).toBe(401);
    expect(response.body.error).toBeTruthy();
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
  it('Should not display contractors for non-authenticated user', async () => {
    const response = await request(server).get('/api/contractors');
    expect(response.status).toBe(401);
    expect(response.body.error).toBeTruthy();
  });
});

describe('Schedules routes', () => {
  let contractor;
  beforeAll(async () => {
    const randomContractor = await query(`
      SELECT * FROM contractors ORDER BY RANDOM() LIMIT 1;
    `);
    [contractor] = randomContractor.rows;
  });
  it("Should display contractor's upcoming schedule when provided ID.", async () => {
    const response = await request(server)
      .get(`/api/schedules/${contractor.id}`)
      .set('authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.schedule)).toBeTruthy();
  });
});
