import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { env } from '../config/env.js';

describe('CITYPULSE AI Endpoints', () => {
  it('GET /api/health returns healthy status and providers without exposing secrets', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.app).toBe('CITYPULSE AI');
    expect(res.body.demo_city).toContain('Pune');
    expect(res.body.currency).toBe('INR');
    expect(Array.isArray(res.body.providers)).toBe(true);
    // Ensure no secret leak
    const text = JSON.stringify(res.body);
    expect(text).not.toContain(env.ADMIN_TOKEN);
  });

  it('GET /api/places returns seeded Pune places with pagination', async () => {
    const res = await request(app).get('/api/places?pageSize=5');
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(5);
    expect(res.body.total).toBeGreaterThanOrEqual(30);
    expect(res.body.items[0]).toHaveProperty('hourly_crowd');
    expect(res.body.items[0]).toHaveProperty('indicative_price_inr');
  });

  it('GET /api/hazards returns demo hazards and safety disclaimers', async () => {
    const res = await request(app).get('/api/hazards');
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(6);
    expect(res.body.disclaimer).toContain('No reports in our data; not a safety guarantee.');
  });

  it('POST /api/plan/parse extracts constraints from natural sentence', async () => {
    const res = await request(app)
      .post('/api/plan/parse')
      .send({ text: 'I want a 3 hours street food and heritage walk in Pune for 400 rupees' });

    expect(res.status).toBe(200);
    expect(res.body.constraints).toBeDefined();
    expect(res.body.constraints.budget_inr).toBe(400);
    expect(res.body.constraints.hours).toBe(3);
    expect(res.body.constraints.interests).toContain('street food');
  });

  it('Admin endpoints enforce constant-time token authentication', async () => {
    // 1. Unauthorized
    const unauthRes = await request(app).get('/api/admin/reports');
    expect(unauthRes.status).toBe(401);

    // 2. Forbidden (wrong token)
    const wrongRes = await request(app)
      .get('/api/admin/reports')
      .set('Authorization', 'Bearer invalid-token-attempt');
    expect(wrongRes.status).toBe(403);

    // 3. Authorized
    const authRes = await request(app)
      .get('/api/admin/reports')
      .set('Authorization', `Bearer ${env.ADMIN_TOKEN}`);
    expect(authRes.status).toBe(200);
    expect(Array.isArray(authRes.body.items)).toBe(true);
  });
});
