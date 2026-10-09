import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

declare global {
  namespace Express {
    interface Request {
      sessionId: string;
    }
  }
}

export function sessionMiddleware(req: Request, res: Response, next: NextFunction): void {
  let sid = req.cookies?.cp_sid;

  if (!sid || typeof sid !== 'string' || sid.length < 16) {
    sid = `sid_${crypto.randomBytes(16).toString('hex')}`;
    res.cookie('cp_sid', sid, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
  }

  req.sessionId = sid;
  next();
}
