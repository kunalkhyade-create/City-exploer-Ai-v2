import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { db } from '../db/sqlite.js';
import { uploadMiddleware, processAndSaveFile } from '../middleware/upload.js';
import { redactPii } from '../utils/redaction.js';
import { aiProvider } from '../providers/ai.js';

const router = Router();

const reportFieldsSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  category: z.string().optional().default('general'),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  city: z.string().optional().default('Pune'),
});

// GET /api/reports
// Policy: Only Verified or Resolved shown as facts. Pending/Under Review shown as "Unverified" with description withheld. Rejected hidden.
router.get('/', (req, res) => {
  const city = req.query.city as string | undefined;

  let rows;
  if (city && city !== 'all') {
    rows = db.prepare(`
      SELECT id, title, description, category, lat, lng, status, source_tag, created_at, updated_at, city
      FROM reports
      WHERE status != 'Rejected' AND LOWER(city) = LOWER(?)
      ORDER BY created_at DESC
    `).all(city) as Array<{
      id: string;
      title: string;
      description: string;
      category: string;
      lat: number;
      lng: number;
      status: string;
      source_tag: string;
      created_at: string;
      updated_at: string;
      city?: string;
    }>;
  } else {
    rows = db.prepare(`
      SELECT id, title, description, category, lat, lng, status, source_tag, created_at, updated_at, city
      FROM reports
      WHERE status != 'Rejected'
      ORDER BY created_at DESC
    `).all() as Array<{
      id: string;
      title: string;
      description: string;
      category: string;
      lat: number;
      lng: number;
      status: string;
      source_tag: string;
      created_at: string;
      updated_at: string;
      city?: string;
    }>;
  }

  const sanitizedList = rows.map(r => {
    const isVerifiedFact = r.status === 'Verified' || r.status === 'Resolved';
    return {
      id: r.id,
      title: r.title,
      // Withhold description if unverified
      description: isVerifiedFact ? r.description : '[Description withheld until community verification]',
      category: r.category,
      lat: r.lat,
      lng: r.lng,
      status: isVerifiedFact ? r.status : 'Unverified',
      actualStatus: isVerifiedFact ? r.status : 'Pending Review',
      isFact: isVerifiedFact,
      source_tag: r.source_tag,
      created_at: r.created_at,
      updated_at: r.updated_at,
      safetyDisclaimer: 'No reports in our data; not a safety guarantee.',
    };
  });

  res.json({
    items: sanitizedList,
    total: sanitizedList.length,
    policyNotice: 'Only Verified or Resolved reports are presented as factual. Descriptions for pending submissions are withheld to protect community safety.',
  });
});

// GET /api/reports/:id (with status history & media list)
router.get('/:id', (req, res) => {
  const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id) as {
    id: string;
    title: string;
    description: string;
    category: string;
    lat: number;
    lng: number;
    status: string;
    source_tag: string;
    created_at: string;
    updated_at: string;
  } | undefined;

  if (!report) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Report not found' } });
    return;
  }

  const history = db.prepare(`
    SELECT id, old_status, new_status, moderator_note, changed_at
    FROM report_status_history
    WHERE report_id = ?
    ORDER BY changed_at ASC
  `).all(req.params.id);

  const media = db.prepare(`
    SELECT id, original_name, media_type, mime_type, file_size, created_at
    FROM report_media
    WHERE report_id = ?
  `).all(req.params.id);

  const isVerifiedFact = report.status === 'Verified' || report.status === 'Resolved';

  res.json({
    id: report.id,
    title: report.title,
    description: isVerifiedFact ? report.description : '[Description withheld until verification]',
    category: report.category,
    lat: report.lat,
    lng: report.lng,
    status: isVerifiedFact ? report.status : 'Unverified',
    source_tag: report.source_tag,
    created_at: report.created_at,
    history,
    media,
    safetyDisclaimer: 'No reports in our data; not a safety guarantee.',
  });
});

// POST /api/reports (multipart with optional photo and voice note)
router.post('/', uploadMiddleware.array('files', 2), async (req, res, next) => {
  try {
    const rawBody = reportFieldsSchema.parse(req.body);

    // 1. Redact phone numbers and emails from text
    const redactedTitle = redactPii(rawBody.title);
    const redactedDesc = redactPii(rawBody.description);

    // 2. Classify via AI Provider
    const classification = await aiProvider.classifyReport(redactedTitle.sanitized, redactedDesc.sanitized);

    const reportId = `rep_${crypto.randomBytes(8).toString('hex')}`;
    const nowIso = new Date().toISOString();
    const finalCategory = rawBody.category && rawBody.category !== 'general' 
      ? rawBody.category 
      : classification.category;

    db.prepare(`
      INSERT INTO reports (
        id, title, description, category, lat, lng,
        status, source_tag, session_id, created_at, updated_at, city
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      reportId,
      redactedTitle.sanitized,
      redactedDesc.sanitized,
      finalCategory,
      rawBody.lat,
      rawBody.lng,
      'Pending',
      'Community',
      req.sessionId,
      nowIso,
      nowIso,
      rawBody.city || 'Pune'
    );

    // Initial status history log
    db.prepare(`
      INSERT INTO report_status_history (
        id, report_id, old_status, new_status, moderator_note, changed_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      `hist_${crypto.randomBytes(6).toString('hex')}`,
      reportId,
      'None',
      'Pending',
      'Submitted by community user (automated intake)',
      nowIso
    );

    // 3. Process and validate files (photo & audio)
    const files = (req.files as Express.Multer.File[]) || [];
    const savedMediaList = [];

    const insertMedia = db.prepare(`
      INSERT INTO report_media (
        id, report_id, file_path, original_name, mime_type, file_size, media_type, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const f of files) {
      const savedFile = processAndSaveFile(f);
      const mediaId = `med_${crypto.randomBytes(6).toString('hex')}`;
      insertMedia.run(
        mediaId,
        reportId,
        savedFile.savedFileName,
        savedFile.originalName,
        savedFile.mimeType,
        savedFile.size,
        savedFile.mediaType,
        nowIso
      );
      savedMediaList.push({
        id: mediaId,
        originalName: savedFile.originalName,
        mediaType: savedFile.mediaType,
        size: savedFile.size,
      });
    }

    res.status(201).json({
      message: 'Report submitted for moderation',
      id: reportId,
      category: finalCategory,
      piiRedacted: redactedTitle.hadPii || redactedDesc.hadPii,
      redactedCounts: {
        emails: redactedTitle.redactedCounts.emails + redactedDesc.redactedCounts.emails,
        phones: redactedTitle.redactedCounts.phones + redactedDesc.redactedCounts.phones,
      },
      mediaFilesSaved: savedMediaList.length,
      status: 'Pending',
      aiClassification: classification,
      source_tag: 'Community',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
