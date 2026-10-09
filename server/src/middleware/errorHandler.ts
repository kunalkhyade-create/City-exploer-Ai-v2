import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  logger.error('Unhandled API Error:', err);

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data provided',
        details: err.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      },
    });
    return;
  }

  if (err instanceof Error) {
    const isClientError = err.message.includes('MIME') || err.message.includes('magic bytes') || err.message.includes('size');
    res.status(isClientError ? 400 : 500).json({
      error: {
        code: isClientError ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
        message: err.message,
      },
    });
    return;
  }

  res.status(500).json({
    error: {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected internal error occurred',
    },
  });
}
