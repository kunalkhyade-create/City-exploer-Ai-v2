import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/sqlite.js';

const router = Router();

const saveSchema = z.object({
  place_id: z.string().min(1),
});

// GET /api/saved
router.get('/', (req, res) => {
  const sessionId = req.sessionId;
  const saved = db.prepare(`
    SELECT sp.place_id, sp.saved_at, p.name, p.category, p.description, p.lat, p.lng,
           p.indicative_price_inr, p.step_free, p.hourly_crowd, p.source_tag
    FROM saved_places sp
    JOIN places p ON sp.place_id = p.id
    WHERE sp.session_id = ?
    ORDER BY sp.saved_at DESC
  `).all(sessionId) as Array<Record<string, unknown>>;

  const formatted = saved.map(s => ({
    ...s,
    step_free: Boolean(s.step_free),
    hourly_crowd: typeof s.hourly_crowd === 'string' ? JSON.parse(s.hourly_crowd as string) : s.hourly_crowd,
  }));

  res.json({
    items: formatted,
    total: formatted.length,
  });
});

// POST /api/saved
router.post('/', (req, res, next) => {
  try {
    const { place_id } = saveSchema.parse(req.body);
    const place = db.prepare('SELECT id FROM places WHERE id = ?').get(place_id);
    if (!place) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Place to save not found' } });
      return;
    }

    const nowIso = new Date().toISOString();
    db.prepare(`
      INSERT OR IGNORE INTO saved_places (session_id, place_id, saved_at)
      VALUES (?, ?, ?)
    `).run(req.sessionId, place_id, nowIso);

    res.status(201).json({ message: 'Place bookmarked', place_id, saved_at: nowIso });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/saved/:placeId
router.delete('/:placeId', (req, res) => {
  db.prepare(`
    DELETE FROM saved_places
    WHERE session_id = ? AND place_id = ?
  `).run(req.sessionId, req.params.placeId);

  res.json({ message: 'Bookmark removed', place_id: req.params.placeId });
});

export default router;
