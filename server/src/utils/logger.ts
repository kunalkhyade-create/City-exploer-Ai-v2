import { env } from '../config/env.js';

const SENSITIVE_PATTERNS = [
  /Bearer\s+[A-Za-z0-9_\-\.]+/gi,
  /(api_?key|token|secret|authorization)=[^&\s]+/gi,
  /(api_?key|token|secret|authorization)["']?\s*:\s*["'][^"']+["']/gi,
];

function sanitize(message: unknown): string {
  let str = typeof message === 'string' ? message : JSON.stringify(message);
  
  // Mask known env secrets if present
  if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.length > 4) {
    str = str.split(env.GEMINI_API_KEY).join('[REDACTED_GEMINI_KEY]');
  }
  if (env.ORS_API_KEY && env.ORS_API_KEY.length > 4) {
    str = str.split(env.ORS_API_KEY).join('[REDACTED_ORS_KEY]');
  }
  if (env.ADMIN_TOKEN && env.ADMIN_TOKEN.length > 4) {
    str = str.split(env.ADMIN_TOKEN).join('[REDACTED_ADMIN_TOKEN]');
  }

  for (const pattern of SENSITIVE_PATTERNS) {
    str = str.replace(pattern, '[REDACTED_CREDENTIAL]');
  }

  return str;
}

export const logger = {
  info: (msg: unknown, ...args: unknown[]) => {
    console.log(`[INFO] ${sanitize(msg)}`, ...args.map(a => sanitize(a)));
  },
  warn: (msg: unknown, ...args: unknown[]) => {
    console.warn(`[WARN] ${sanitize(msg)}`, ...args.map(a => sanitize(a)));
  },
  error: (msg: unknown, ...args: unknown[]) => {
    console.error(`[ERROR] ${sanitize(msg)}`, ...args.map(a => sanitize(a)));
  },
  debug: (msg: unknown, ...args: unknown[]) => {
    if (env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] ${sanitize(msg)}`, ...args.map(a => sanitize(a)));
    }
  },
};
