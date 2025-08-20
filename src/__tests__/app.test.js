const request = require('supertest');
const app = require('../index');

describe('API Endpoints', () => {
  it('should return health check information', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'UP');
  });

  it('should return readiness information', async () => {
    const res = await request(app).get('/ready');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'READY');
  });

  it('should return Kubernetes information', async () => {
    const res = await request(app).get('/k8sinfo');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('namespace');
    expect(res.body).toHaveProperty('podName');
  });

  it('should return welcome information at the root', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('name', 'DevOps Demo Application');
    expect(res.body).toHaveProperty('kubernetes');
  });

  it('should return HTML UI page', async () => {
    const res = await request(app).get('/ui');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('<!DOCTYPE html>');
    expect(res.text).toContain('DevOps Demo Application');
  });

  it('should get all users', async () => {
    const res = await request(app).get('/api/users');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should get a user by ID', async () => {
    const res = await request(app).get('/api/users/1');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('id', 1);
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('email');
  });

  it('should return 404 for non-existent user', async () => {
    const res = await request(app).get('/api/users/999');
    expect(res.statusCode).toEqual(404);
  });

  it('should create a new user', async () => {
    const newUser = { name: 'Test User', email: 'test@example.com' };
    const res = await request(app)
      .post('/api/users')
      .send(newUser);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('name', newUser.name);
    expect(res.body).toHaveProperty('email', newUser.email);
  });

  it('should require name and email when creating a user', async () => {
    const invalidUser = { name: 'Missing Email' };
    const res = await request(app)
      .post('/api/users')
      .send(invalidUser);
    expect(res.statusCode).toEqual(400);
  });
});