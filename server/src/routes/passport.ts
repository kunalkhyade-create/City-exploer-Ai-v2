import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { db } from '../db/sqlite.js';

const router = Router();

const passportSchema = z.object({
  interests: z.array(z.string()).default(['heritage', 'street food']),
  budget_inr: z.number().int().min(0).max(100000).default(600),
  travel_mode: z.enum(['foot-walking', 'cycling-regular', 'driving-car']).default('foot-walking'),
  pace: z.enum(['relaxed', 'moderate', 'packed']).default('moderate'),
  accessibility: z.array(z.string()).default([]),
  crowd_preference: z.enum(['peaceful', 'balanced', 'buzzing']).default('peaceful'),
  indoor_outdoor: z.enum(['indoor', 'outdoor', 'balanced']).default('balanced'),
  preferred_language: z.enum(['en', 'hi', 'mr']).default('en'),
  default_city: z.string().default('Pune'),
});

// GET /api/passport
router.get('/', (req, res) => {
  const userId = req.cookies?.cp_auth;
  const sessionId = req.sessionId;

  let row = null;
  if (userId) {
    row = db.prepare('SELECT * FROM user_passports WHERE user_id = ?').get(userId);
  }
  if (!row && sessionId) {
    row = db.prepare('SELECT * FROM user_passports WHERE session_id = ?').get(sessionId);
  }

  if (!row) {
    // Return default passport
    res.json({
      passport: {
        interests: ['heritage', 'street food'],
        budget_inr: 600,
        travel_mode: 'foot-walking',
        pace: 'moderate',
        accessibility: [],
        crowd_preference: 'peaceful',
        indoor_outdoor: 'balanced',
        preferred_language: 'en',
        default_city: 'Pune',
        isNew: true,
      },
    });
    return;
  }

  const p = row as any;
  res.json({
    passport: {
      interests: JSON.parse(p.interests),
      budget_inr: p.budget_inr,
      travel_mode: p.travel_mode,
      pace: p.pace,
      accessibility: JSON.parse(p.accessibility),
      crowd_preference: p.crowd_preference,
      indoor_outdoor: p.indoor_outdoor,
      preferred_language: p.preferred_language,
      default_city: p.default_city,
      isNew: false,
    },
  });
});

// POST /api/passport
router.post('/', (req, res, next) => {
  try {
    const data = passportSchema.parse(req.body);
    const userId = req.cookies?.cp_auth || null;
    const sessionId = req.sessionId;
    const nowIso = new Date().toISOString();

    // Check existing
    let existingId: string | null = null;
    if (userId) {
      const row = db.prepare('SELECT id FROM user_passports WHERE user_id = ?').get(userId) as { id: string } | undefined;
      if (row) existingId = row.id;
    }
    if (!existingId && sessionId) {
      const row = db.prepare('SELECT id FROM user_passports WHERE session_id = ?').get(sessionId) as { id: string } | undefined;
      if (row) existingId = row.id;
    }

    if (existingId) {
      db.prepare(`
        UPDATE user_passports
        SET interests = ?, budget_inr = ?, travel_mode = ?, pace = ?,
            accessibility = ?, crowd_preference = ?, indoor_outdoor = ?,
            preferred_language = ?, default_city = ?, updated_at = ?, user_id = COALESCE(?, user_id)
        WHERE id = ?
      `).run(
        JSON.stringify(data.interests),
        data.budget_inr,
        data.travel_mode,
        data.pace,
        JSON.stringify(data.accessibility),
        data.crowd_preference,
        data.indoor_outdoor,
        data.preferred_language,
        data.default_city,
        nowIso,
        userId,
        existingId
      );
    } else {
      const id = `pass_${crypto.randomBytes(8).toString('hex')}`;
      db.prepare(`
        INSERT INTO user_passports (
          id, user_id, session_id, interests, budget_inr, travel_mode,
          pace, accessibility, crowd_preference, indoor_outdoor,
          preferred_language, default_city, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        userId,
        sessionId,
        JSON.stringify(data.interests),
        data.budget_inr,
        data.travel_mode,
        data.pace,
        JSON.stringify(data.accessibility),
        data.crowd_preference,
        data.indoor_outdoor,
        data.preferred_language,
        data.default_city,
        nowIso,
        nowIso
      );
    }

    res.json({
      message: 'Urban Pulse Passport updated',
      passport: data,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
