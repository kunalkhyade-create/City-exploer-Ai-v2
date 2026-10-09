import { Router } from 'express';
import { z } from 'zod';
import { geocodingProvider } from '../providers/geocoding.js';

const router = Router();

const geocodeSchema = z.object({
  query: z.string().min(2, 'Query must be at least 2 characters'),
});

router.post('/', async (req, res, next) => {
  try {
    const { query } = geocodeSchema.parse(req.body);
    const result = await geocodingProvider.geocode(query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
