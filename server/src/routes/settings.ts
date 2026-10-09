import { Router } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';
import { registry } from '../providers/registry.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const settingsRouter = Router();

const apiKeySchema = z.object({
  apiKey: z.string().min(10, 'Gemini API key must be at least 10 characters long'),
  model: z.string().optional().default('gemini-2.0-flash'),
});

// GET /api/settings/gemini-key (status check only, never leaks key value)
settingsRouter.get('/gemini-key', (req, res) => {
  res.json({
    isConfigured: !!env.GEMINI_API_KEY && env.GEMINI_API_KEY.length > 5,
    model: env.GEMINI_MODEL || 'gemini-2.0-flash',
  });
});

// POST /api/settings/gemini-key
settingsRouter.post('/gemini-key', async (req, res, next) => {
  try {
    const { apiKey, model } = apiKeySchema.parse(req.body);
    const trimmedKey = apiKey.trim();

    // Verify key by calling Gemini API with a test ping
    const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${trimmedKey}`;
    const testPayload = {
      contents: [{ role: 'user', parts: [{ text: 'Hello, reply with JSON: {"status":"ok"}' }] }],
      generationConfig: { responseMimeType: 'application/json' },
    };

    const apiRes = await fetch(testUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return res.status(400).json({
        ok: false,
        error: `Gemini API rejected key with HTTP status ${apiRes.status}: ${errText.slice(0, 150)}`,
      });
    }

    // Key is verified! Update runtime memory
    env.GEMINI_API_KEY = trimmedKey;
    if (model) env.GEMINI_MODEL = model;
    registry.recordSuccess('AIProvider (Gemini)', 'live');
    registry.recordSuccess('AIProvider (Gemini Plan)', 'live');

    // Update .env file safely on disk
    try {
      const envPath = path.resolve(__dirname, '../../../.env');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        if (envContent.includes('GEMINI_API_KEY=')) {
          envContent = envContent.replace(/GEMINI_API_KEY=.*/g, `GEMINI_API_KEY=${trimmedKey}`);
        } else {
          envContent += `\nGEMINI_API_KEY=${trimmedKey}\n`;
        }
        if (model) {
          if (envContent.includes('GEMINI_MODEL=')) {
            envContent = envContent.replace(/GEMINI_MODEL=.*/g, `GEMINI_MODEL=${model}`);
          } else {
            envContent += `\nGEMINI_MODEL=${model}\n`;
          }
        }
        fs.writeFileSync(envPath, envContent, 'utf8');
      }
    } catch (fsErr) {
      logger.warn('Could not write GEMINI_API_KEY to disk .env, updated in memory:', fsErr);
    }

    logger.info('Gemini API key successfully verified and activated.');
    res.json({
      ok: true,
      message: 'Gemini AI successfully activated for intelligent plan generation!',
      model: env.GEMINI_MODEL,
    });
  } catch (err: any) {
    next(err);
  }
});
