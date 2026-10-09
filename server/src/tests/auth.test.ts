import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { hashPassword, verifyPassword } from '../utils/auth.js';

describe('Authentication & Password Security', () => {
  it('correctly hashes and verifies passwords using scrypt', () => {
    const password = 'SecretPassword123!';
    const { hash, salt } = hashPassword(password);
    expect(hash).toBeDefined();
    expect(salt).toBeDefined();

    expect(verifyPassword(password, hash, salt)).toBe(true);
    expect(verifyPassword('WrongPassword', hash, salt)).toBe(false);
  });

  it('registers a new user and denies duplicate registrations', async () => {
    const testEmail = `user_${Date.now()}@test.com`;
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail, password: 'SecurePassword2026', name: 'Test Explorer' });

    expect(regRes.status).toBe(201);
    expect(regRes.body.user).toBeDefined();
    expect(regRes.body.user.email).toBe(testEmail);

    // Duplicate check
    const dupRes = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail, password: 'AnotherPassword' });

    expect(dupRes.status).toBe(409);
    expect(dupRes.body.error.code).toBe('USER_EXISTS');
  });

  it('logs in user with valid credentials and sets cookie', async () => {
    const testEmail = `login_${Date.now()}@test.com`;
    await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail, password: 'MyPassword123' });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'MyPassword123' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user.email).toBe(testEmail);
    expect(loginRes.headers['set-cookie']).toBeDefined();

    // Wrong password check
    const wrongRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'BadPassword' });

    expect(wrongRes.status).toBe(401);
    expect(wrongRes.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});
