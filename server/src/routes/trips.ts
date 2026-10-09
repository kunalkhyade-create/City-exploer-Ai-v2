import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { db } from '../db/sqlite.js';

const router = Router();

const createTripSchema = z.object({
  title: z.string().min(1).default('My Pune Day Plan'),
  budget_inr: z.number().int().min(0).default(500),
  travel_mode: z.enum(['foot-walking', 'cycling-regular', 'driving-car']).default('foot-walking'),
  pace: z.enum(['relaxed', 'moderate', 'packed']).default('moderate'),
  start_time: z.string().default('10:00'),
  total_cost_inr: z.number().int().default(0),
  total_duration_minutes: z.number().int().default(0),
  stops: z.array(z.object({
    place_id: z.string(),
    stop_order: z.number().int(),
    arrival_time: z.string(),
    departure_time: z.string(),
    duration_minutes: z.number().int(),
    cost_inr: z.number().int(),
    why_this: z.string(),
    notes: z.string().optional(),
  })).optional().default([]),
});

const patchTripSchema = z.object({
  title: z.string().optional(),
  budget_inr: z.number().int().optional(),
  pace: z.enum(['relaxed', 'moderate', 'packed']).optional(),
  start_time: z.string().optional(),
});

const addStopSchema = z.object({
  place_id: z.string(),
  stop_order: z.number().int(),
  arrival_time: z.string(),
  departure_time: z.string(),
  duration_minutes: z.number().int(),
  cost_inr: z.number().int(),
  why_this: z.string(),
  notes: z.string().optional(),
});

// GET /api/trips - list trips for current browser session
router.get('/', (req, res) => {
  const sessionId = req.sessionId;
  const trips = db.prepare(`
    SELECT * FROM trips WHERE session_id = ? ORDER BY created_at DESC
  `).all(sessionId) as Array<Record<string, unknown>>;

  const tripsWithStops = trips.map(t => {
    const stops = db.prepare(`
      SELECT ts.*, p.name as place_name, p.category as place_category, p.lat, p.lng
      FROM trip_stops ts
      JOIN places p ON ts.place_id = p.id
      WHERE ts.trip_id = ?
      ORDER BY ts.stop_order ASC
    `).all(t.id as string);
    return { ...t, stops };
  });

  res.json({
    items: tripsWithStops,
    total: tripsWithStops.length,
  });
});

// POST /api/trips
router.post('/', (req, res, next) => {
  try {
    const data = createTripSchema.parse(req.body);
    const tripId = `trip_${crypto.randomBytes(8).toString('hex')}`;
    const nowIso = new Date().toISOString();

    db.prepare(`
      INSERT INTO trips (
        id, session_id, title, budget_inr, travel_mode, pace,
        start_time, total_cost_inr, total_duration_minutes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      tripId,
      req.sessionId,
      data.title,
      data.budget_inr,
      data.travel_mode,
      data.pace,
      data.start_time,
      data.total_cost_inr,
      data.total_duration_minutes,
      nowIso,
      nowIso
    );

    const insertStop = db.prepare(`
      INSERT INTO trip_stops (
        id, trip_id, place_id, stop_order, arrival_time, departure_time,
        duration_minutes, cost_inr, why_this, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const stop of data.stops) {
      const stopId = `stop_${crypto.randomBytes(8).toString('hex')}`;
      insertStop.run(
        stopId,
        tripId,
        stop.place_id,
        stop.stop_order,
        stop.arrival_time,
        stop.departure_time,
        stop.duration_minutes,
        stop.cost_inr,
        stop.why_this,
        stop.notes || null
      );
    }

    const createdTrip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
    res.status(201).json(createdTrip);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/trips/:id
router.patch('/:id', (req, res, next) => {
  try {
    const updates = patchTripSchema.parse(req.body);
    const trip = db.prepare('SELECT * FROM trips WHERE id = ? AND session_id = ?').get(req.params.id, req.sessionId);

    if (!trip) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Trip not found or does not belong to session' } });
      return;
    }

    const nowIso = new Date().toISOString();
    const fields: string[] = ['updated_at = ?'];
    const values: unknown[] = [nowIso];

    if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
    if (updates.budget_inr !== undefined) { fields.push('budget_inr = ?'); values.push(updates.budget_inr); }
    if (updates.pace !== undefined) { fields.push('pace = ?'); values.push(updates.pace); }
    if (updates.start_time !== undefined) { fields.push('start_time = ?'); values.push(updates.start_time); }

    values.push(req.params.id);
    db.prepare(`UPDATE trips SET ${fields.join(', ')} WHERE id = ?`).run(...(values as any[]));

    const updated = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/trips/:id
router.delete('/:id', (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ? AND session_id = ?').get(req.params.id, req.sessionId);
  if (!trip) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Trip not found' } });
    return;
  }

  db.prepare('DELETE FROM trips WHERE id = ?').run(req.params.id);
  res.json({ message: 'Trip successfully deleted', id: req.params.id });
});

// GET /api/trips/:id/stops
router.get('/:id/stops', (req, res) => {
  const stops = db.prepare(`
    SELECT ts.*, p.name as place_name, p.category, p.lat, p.lng
    FROM trip_stops ts
    JOIN places p ON ts.place_id = p.id
    WHERE ts.trip_id = ?
    ORDER BY ts.stop_order ASC
  `).all(req.params.id);
  res.json({ stops });
});

// POST /api/trips/:id/stops
router.post('/:id/stops', (req, res, next) => {
  try {
    const data = addStopSchema.parse(req.body);
    const stopId = `stop_${crypto.randomBytes(8).toString('hex')}`;
    db.prepare(`
      INSERT INTO trip_stops (
        id, trip_id, place_id, stop_order, arrival_time, departure_time,
        duration_minutes, cost_inr, why_this, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      stopId,
      req.params.id,
      data.place_id,
      data.stop_order,
      data.arrival_time,
      data.departure_time,
      data.duration_minutes,
      data.cost_inr,
      data.why_this,
      data.notes || null
    );

    res.status(201).json({ id: stopId, ...data });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/trips/:id/stops/:stopId
router.delete('/:id/stops/:stopId', (req, res) => {
  db.prepare('DELETE FROM trip_stops WHERE id = ? AND trip_id = ?').run(req.params.stopId, req.params.id);
  res.json({ message: 'Stop deleted', stopId: req.params.stopId });
});

export default router;
