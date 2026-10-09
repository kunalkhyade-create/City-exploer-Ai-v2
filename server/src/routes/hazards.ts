import { Router } from 'express';
import { db } from '../db/sqlite.js';

const router = Router();

router.get('/', (req, res) => {
  const city = req.query.city as string | undefined;

  let hazards;
  if (city && city !== 'all') {
    hazards = db.prepare(`
      SELECT * FROM hazards WHERE LOWER(city) = LOWER(?) ORDER BY created_at DESC
    `).all(city);
  } else {
    hazards = db.prepare(`
      SELECT * FROM hazards ORDER BY created_at DESC
    `).all();
  }

  res.json({
    items: hazards,
    total: hazards.length,
    city: city || 'All',
    notice: 'Simulated community alerts (DEMO DATA). Do not rely for life safety.',
    disclaimer: 'No reports in our data; not a safety guarantee.',
  });
});

export default router;
