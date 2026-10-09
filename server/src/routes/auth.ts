import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { db } from '../db/sqlite.js';
import { hashPassword, verifyPassword, UserRecord } from '../utils/auth.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

// POST /api/auth/register
router.post('/register', (req, res, next) => {
  try {
    const { email, password, name } = registerSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existing) {
      res.status(409).json({
        error: {
          code: 'USER_EXISTS',
          message: 'An account with this email address already exists. Please sign in.',
        },
      });
      return;
    }

    const userId = `usr_${crypto.randomBytes(8).toString('hex')}`;
    const { hash, salt } = hashPassword(password);
    const nowIso = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, email, password_hash, salt, name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      normalizedEmail,
      hash,
      salt,
      name ? name.trim() : normalizedEmail.split('@')[0],
      nowIso,
      nowIso
    );

    // Set auth cookie
    res.cookie('cp_auth', userId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      user: {
        id: userId,
        email: normalizedEmail,
        name: name ? name.trim() : normalizedEmail.split('@')[0],
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail) as UserRecord | undefined;
    if (!user) {
      res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email address or password.',
        },
      });
      return;
    }

    const isValid = verifyPassword(password, user.password_hash, user.salt);
    if (!isValid) {
      res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email address or password.',
        },
      });
      return;
    }

    res.cookie('cp_auth', user.id, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const userId = req.cookies?.cp_auth;
  if (!userId) {
    res.json({ user: null });
    return;
  }

  const user = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(userId) as {
    id: string;
    email: string;
    name: string | null;
    created_at: string;
  } | undefined;

  if (!user) {
    res.clearCookie('cp_auth');
    res.json({ user: null });
    return;
  }

  res.json({ user });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('cp_auth');
  res.json({ message: 'Successfully logged out' });
});

export default router;
