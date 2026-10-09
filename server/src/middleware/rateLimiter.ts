import rateLimit from 'express-rate-limit';

export const standardRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please slow down and try again later.',
    },
  },
});

export const planGenerationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30, // 30 plan generations per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Plan generation rate limit reached. Please wait a minute.',
    },
  },
});
