const request = require('supertest');
const server = require('../server');
const { query } = require('../../db');

const testUser = {
  username: 'TEST_USER',
  password: 'TEST_PASSWORD',
  email: 'TEST_EMAIL@email.com',
  phoneNumber: '(555) 555-5555',
  contractorName: 'TEST_CONTRACTOR_INC',
  streetAddress: '123 TEST ST.',
  city: 'TEST_CITY',
  stateAbbr: 'TE',
  zipCode: '55555',
};

let token;

beforeEach(async () => {
  const response = await request(server)
    .post('/api/auth/register')
    .send({ ...testUser });
  ({ token } = response.body);
});

afterEach(async () => {
  await query(`DELETE FROM contractors WHERE name = $1;`, [
    testUser.contractorName,
  ]);
});

describe('Auth routes', () => {
  const newUser = {
    username: 'NEW_USER',
    password: 'NEW_PASSWORD',
    email: 'NEW_EMAIL@NEW.COM',
    phoneNumber: '(123) 456-7890',
  };
  const newContractor = {
    ...newUser,
    contractorName: 'NEW_CONTRACTOR',
    streetAddress: '123 Anywhere St.',
    city: 'Anywhere',
    stateAbbr: 'TE',
    zipCode: '00000',
  };
  afterEach(async () => {
    await query(`DELETE FROM contractors WHERE name = $1`, [
      newContractor.contractorName,
    ]);
    await query(`DELETE FROM users WHERE username = $1`, [newUser.username]);
  });
  it('Should return token on user registration', async () => {
    const response = await request(server)
      .post('/api/auth/register')
      .send(newUser);
    expect(response.status).toBe(201);
    expect(response.body.token).toBeTruthy();
  });
  it('Should return 400 BAD REQUEST when missing required keys in request body', async () => {
    const { email, ...malformedUser } = newUser;
    const response = await request(server)
      .post('/api/auth/register')
      .send(malformedUser);
    expect(response.status).toBe(400);
    expect(response.body.error).toBeTruthy();
  });
  it('Should add and link contractor entry if contractor info is provided', async () => {
    const response = await request(server)
      .post('/api/auth/register')
      .send(newContractor);
    expect(response.status).toBe(201);
    expect(response.body.token).toBeTruthy();
  });
  it('Should return 400 BAD REQUEST if incomplete contractor info is provided', async () => {
    const { city, ...malformedContractor } = newContractor;
    const response = await request(server)
      .post('/api/auth/register')
      .send(malformedContractor);
    expect(response.status).toBe(400);
    expect(response.body.error).toBeTruthy();
  });
  it('Should return 400 BAD REQUEST if attempting to insert duplicate info', async () => {
    await request(server)
      .post('/api/auth/register')
      .send(newContractor);
    const response = await request(server)
      .post('/api/auth/register')
      .send(newContractor);
    expect(response.status).toBe(400);
    expect(response.body.error).toBeTruthy();
  });
});

describe('User routes', () => {
  it("Should return authorized user's information", async () => {
    const response = await request(server)
      .get('/api/users')
      .set('authorization', `Bearer ${token}`);
    expect(response.body.user.username).toBe(testUser.username);
    expect(response.body.user.contractorId).toBeTruthy();
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
  let scheduleId;
  beforeEach(async () => {
    const response = await request(server)
      .post('/api/schedules')
      .send({ startTime: '2042-04-22 04:00:00 -6:00', duration: '8h' })
      .set('authorization', `Bearer ${token}`);
    scheduleId = response.body.created.id;
  });
  afterEach(async () => {
    await request(server)
      .delete(`/api/schedules/${scheduleId}`)
      .set('authorization', `Bearer ${token}`);
  });
  it("Should display contractor's upcoming schedule when provided ID.", async () => {
    const user = await request(server)
      .get('/api/users')
      .set('authorization', `Bearer ${token}`);
    const response = await request(server)
      .get(`/api/schedules/contractor/${user.body.user.contractorId}`)
      .set('authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.schedule)).toBeTruthy();
  });
  it('Should allow contractor to post new availability block', async () => {
    const availability = {
      startTime: '2019-06-22 06:00:00 -6:00',
      duration: '8h',
    };
    const response = await request(server)
      .post('/api/schedules')
      .send(availability)
      .set('authorization', `Bearer ${token}`);
    expect(response.status).toBe(201);
    expect(response.body.created).toBeTruthy();
  });
  it('Should allow contractor to update an availability block', async () => {
    afterAll(async () => {
      await request(server)
        .delete(`/api/schedules/${scheduleId}`)
        .set('authorization', `Bearer ${token}`);
    });
    const response = await request(server)
      .put(`/api/schedules/${scheduleId}`)
      .send({ startTime: '2042-04-23 04:00:00 -6:00', duration: '5h' })
      .set('authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.updated.duration).toEqual({ hours: 5 });
  });
  it('Should allow contractor to delete an availability block', async () => {
    const response = await request(server)
      .delete(`/api/schedules/${scheduleId}`)
      .set('authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
  });
});

describe('Services routes', () => {
  const testService = { name: 'TEST_SERVICE', price: '$20.00' };
  afterEach(async () => {
    await query('DELETE FROM services WHERE name = $1', [testService.name]);
  });
  it('Should allow user to pull list of services based on contractorId', async () => {
    const user = await request(server)
      .get('/api/users')
      .set('authorization', `Bearer ${token}`);
    const response = await request(server)
      .get(`/api/services/contractor/${user.body.user.contractorId}`)
      .set('authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.services)).toBeTruthy();
  });
  it('Should allow contractor to add new services', async () => {
    const response = await request(server)
      .post('/api/services')
      .send(testService)
      .set('authorization', `Bearer ${token}`);
    expect(response.status).toBe(201);
    expect(response.body.created.name).toBe('TEST_SERVICE');
  });
  it('Should allow contractor to edit services', async () => {
    const service = await request(server)
      .post('/api/services')
      .send(testService)
      .set('authorization', `Bearer ${token}`);
    const response = await request(server)
      .put(`/api/services/${service.body.created.id}`)
      .send({ name: 'TEST_SERVICE', price: '$30.00' })
      .set('authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.updated.price).toBe('$30.00');
  });
});
