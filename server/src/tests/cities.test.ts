import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';

describe('Multi-City & Urban Pulse Passport', () => {
  it('GET /api/cities returns supported destinations including Pune, Mumbai, Delhi, etc.', async () => {
    const res = await request(app).get('/api/cities');
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(5);

    const pune = res.body.items.find((c: any) => c.name === 'Pune');
    const mumbai = res.body.items.find((c: any) => c.name === 'Mumbai');
    expect(pune).toBeDefined();
    expect(pune.coverage.liveWeather).toBe(true);
    expect(mumbai).toBeDefined();
    expect(mumbai.lat).toBeCloseTo(19.0760, 2);
  });

  it('GET /api/places?city=Mumbai returns places filtered for Mumbai', async () => {
    const res = await request(app).get('/api/places?city=Mumbai');
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.items.every((p: any) => p.city.toLowerCase() === 'mumbai')).toBe(true);
  });

  it('GET and POST /api/passport updates user preferences', async () => {
    const agent = request.agent(app);
    const postRes = await agent
      .post('/api/passport')
      .send({
        interests: ['nature', 'heritage'],
        budget_inr: 800,
        travel_mode: 'cycling-regular',
        pace: 'relaxed',
        accessibility: ['step_free'],
        crowd_preference: 'peaceful',
        indoor_outdoor: 'outdoor',
        preferred_language: 'mr',
        default_city: 'Mumbai',
      });

    expect(postRes.status).toBe(200);
    expect(postRes.body.passport.budget_inr).toBe(800);
    expect(postRes.body.passport.default_city).toBe('Mumbai');

    const getRes = await agent.get('/api/passport');
    expect(getRes.status).toBe(200);
    expect(getRes.body.passport.budget_inr).toBe(800);
  });
});
