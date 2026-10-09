import { Router } from 'express';
import { z } from 'zod';
import { weatherProvider } from '../providers/weather.js';

const router = Router();

const weatherQuerySchema = z.object({
  lat: z.coerce.number().optional().default(18.5204),
  lng: z.coerce.number().optional().default(73.8567),
});

router.get('/', async (req, res, next) => {
  try {
    const query = weatherQuerySchema.parse(req.query);
    const weather = await weatherProvider.getWeather(query.lat, query.lng);
    res.json(weather);
  } catch (err) {
    next(err);
  }
});

export default router;
