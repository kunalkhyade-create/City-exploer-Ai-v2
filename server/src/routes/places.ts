import { Router } from 'express';
import { z } from 'zod';
import { placesProvider } from '../providers/places.js';

const router = Router();

const placesQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  step_free: z.preprocess(v => v === 'true' || v === '1', z.boolean()).optional(),
  hour: z.coerce.number().min(0).max(23).optional(),
  city: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(30),
});

router.get('/', (req, res, next) => {
  try {
    const query = placesQuerySchema.parse(req.query);
    const result = placesProvider.getAll(query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', (req, res) => {
  const place = placesProvider.getById(req.params.id);
  if (!place) {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `Place with ID "${req.params.id}" not found`,
      },
    });
    return;
  }
  res.json(place);
});

export default router;
