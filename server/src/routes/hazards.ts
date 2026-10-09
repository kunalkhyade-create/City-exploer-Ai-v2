import { Router } from 'express';
import { db } from '../db/sqlite.js';

const router = Router();

router.get('/', (req, res) => {
  const hazards = db.prepare(`
    SELECT * FROM hazards ORDER BY created_at DESC
  `).all();

  res.json({
    items: hazards,
    total: hazards.length,
    notice: 'Simulated community alerts (DEMO DATA). Do not rely for life safety.',
    disclaimer: 'No reports in our data; not a safety guarantee.',
  });
});

export default router;
