import { describe, it, expect } from 'vitest';
import { redactPii } from '../utils/redaction.js';

describe('redactPii', () => {
  it('redacts email addresses cleanly', () => {
    const input = 'Reported by user contact@example.com at FC Road junction.';
    const result = redactPii(input);
    expect(result.hadPii).toBe(true);
    expect(result.sanitized).toContain('[REDACTED_EMAIL]');
    expect(result.sanitized).not.toContain('contact@example.com');
  });

  it('redacts Indian 10-digit mobile numbers with or without country code', () => {
    const input1 = 'Call me at 9876543210 regarding the waterlogging.';
    const res1 = redactPii(input1);
    expect(res1.hadPii).toBe(true);
    expect(res1.sanitized).toContain('[REDACTED_PHONE]');

    const input2 = 'Contact +91 98220 12345 near Deccan.';
    const res2 = redactPii(input2);
    expect(res2.hadPii).toBe(true);
    expect(res2.sanitized).toContain('[REDACTED_PHONE]');
  });

  it('preserves clean reports with no PII', () => {
    const clean = 'Waterlogging reported near Alka Talkies bridge, approx 15 cm deep.';
    const res = redactPii(clean);
    expect(res.hadPii).toBe(false);
    expect(res.sanitized).toBe(clean);
  });
});
