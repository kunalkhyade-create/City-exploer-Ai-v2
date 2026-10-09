import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { db } from '../db/sqlite.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// Apply admin token check to all admin routes
router.use(requireAdmin);

const updateStatusSchema = z.object({
  status: z.enum(['Pending', 'Under Review', 'Verified', 'Resolved', 'Rejected']),
  note: z.string().min(2, 'Moderation note is required'),
});

// GET /api/admin/reports (shows all reports unfiltered including full descriptions and rejected status)
router.get('/reports', (req, res) => {
  const reports = db.prepare(`
    SELECT r.*,
      (SELECT count(*) FROM report_media rm WHERE rm.report_id = r.id) as media_count
    FROM reports r
    ORDER BY r.created_at DESC
  `).all();

  res.json({
    items: reports,
    total: reports.length,
  });
});

// PATCH /api/admin/reports/:id
router.patch('/reports/:id', (req, res, next) => {
  try {
    const { status, note } = updateStatusSchema.parse(req.body);
    const existing = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id) as {
      id: string;
      status: string;
    } | undefined;

    if (!existing) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Report not found' } });
      return;
    }

    const nowIso = new Date().toISOString();

    // Update report status
    db.prepare(`
      UPDATE reports
      SET status = ?, updated_at = ?
      WHERE id = ?
    `).run(status, nowIso, req.params.id);

    // Record in history log
    const histId = `hist_${crypto.randomBytes(6).toString('hex')}`;
    db.prepare(`
      INSERT INTO report_status_history (
        id, report_id, old_status, new_status, moderator_note, changed_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      histId,
      req.params.id,
      existing.status,
      status,
      note,
      nowIso
    );

    res.json({
      message: `Report status updated to ${status}`,
      reportId: req.params.id,
      oldStatus: existing.status,
      newStatus: status,
      moderatorNote: note,
      updatedAt: nowIso,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
