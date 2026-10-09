import { Router } from 'express';
import { z } from 'zod';
import { aiProvider, planConstraintsSchema } from '../providers/ai.js';
import { planner, GeneratedPlan } from '../engine/planner.js';
import { replanner } from '../engine/replanner.js';
import { placesProvider } from '../providers/places.js';
import { planGenerationLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const parseRequestSchema = z.object({
  text: z.string().optional().default('Explore highlights in the city'),
});

const generateRequestSchema = z.object({
  constraints: planConstraintsSchema,
  lang: z.enum(['en', 'hi', 'mr']).default('en'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).default('10:00'),
});

const replanRequestSchema = z.object({
  plan: z.any(), // GeneratedPlan
  strategy: z.enum(['avoid_crowds', 'budget_saver', 'alternative_stops']).default('avoid_crowds'),
  lang: z.enum(['en', 'hi', 'mr']).default('en'),
});

const compareRequestSchema = z.object({
  placeIdA: z.string(),
  placeIdB: z.string(),
  currentHour: z.coerce.number().min(0).max(23).default(12),
});

// POST /api/plan/parse
router.post('/parse', planGenerationLimiter, async (req, res, next) => {
  try {
    const rawText = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    const text = rawText.length >= 3 ? rawText : 'Explore highlights in the city';
    const parsed = await aiProvider.parseConstraints(text);
    res.json(parsed);
  } catch (err) {
    next(err);
  }
});

// POST /api/plan/generate
router.post('/generate', planGenerationLimiter, async (req, res, next) => {
  try {
    const { constraints, lang, startTime } = generateRequestSchema.parse(req.body);
    const plan = await planner.generatePlan(constraints, lang, startTime);
    res.json(plan);
  } catch (err) {
    next(err);
  }
});

// POST /api/plan/replan (Plan B with diff)
router.post('/replan', planGenerationLimiter, async (req, res, next) => {
  try {
    const { plan, strategy, lang } = replanRequestSchema.parse(req.body);
    const replanResult = await replanner.generatePlanB(plan as GeneratedPlan, strategy, lang);
    res.json(replanResult);
  } catch (err) {
    next(err);
  }
});

// POST /api/compare
router.post('/compare', (req, res, next) => {
  try {
    const { placeIdA, placeIdB, currentHour } = compareRequestSchema.parse(req.body);
    const placeA = placesProvider.getById(placeIdA);
    const placeB = placesProvider.getById(placeIdB);

    if (!placeA || !placeB) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'One or both places requested for comparison could not be found',
        },
      });
      return;
    }

    const crowdA = placeA.hourly_crowd[currentHour] ?? 0.5;
    const crowdB = placeB.hourly_crowd[currentHour] ?? 0.5;

    res.json({
      comparison: {
        hour: currentHour,
        placeA: {
          ...placeA,
          currentHourCrowd: crowdA,
          crowdStatus: crowdA < 0.4 ? 'Low Crowd' : crowdA < 0.7 ? 'Moderate Crowd' : 'Peak Buzz',
        },
        placeB: {
          ...placeB,
          currentHourCrowd: crowdB,
          crowdStatus: crowdB < 0.4 ? 'Low Crowd' : crowdB < 0.7 ? 'Moderate Crowd' : 'Peak Buzz',
        },
        priceDifferenceInr: placeA.indicative_price_inr - placeB.indicative_price_inr,
        recommendation: crowdA < crowdB ? `${placeA.name} is quieter right now.` : `${placeB.name} is quieter right now.`,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
