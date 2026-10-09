/**
 * Redacts personal identifiable information (PII) including phone numbers and email addresses.
 */

// Email regex pattern matching common formats
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;

// Phone number regex pattern matching Indian numbers (+91..., 0..., 10-digit mobile) and standard numbers
const PHONE_REGEX = /(\+?91[\-\s]?)?[6-9]\d{4}[\-\s]?\d{5}|\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b|\b\d{10}\b/g;

export interface RedactionResult {
  sanitized: string;
  hadPii: boolean;
  redactedCounts: {
    emails: number;
    phones: number;
  };
}

export function redactPii(text: string): RedactionResult {
  if (!text) {
    return { sanitized: '', hadPii: false, redactedCounts: { emails: 0, phones: 0 } };
  }

  let emailsCount = 0;
  let phonesCount = 0;

  let sanitized = text.replace(EMAIL_REGEX, () => {
    emailsCount++;
    return '[REDACTED_EMAIL]';
  });

  sanitized = sanitized.replace(PHONE_REGEX, () => {
    phonesCount++;
    return '[REDACTED_PHONE]';
  });

  return {
    sanitized,
    hadPii: emailsCount > 0 || phonesCount > 0,
    redactedCounts: {
      emails: emailsCount,
      phones: phonesCount,
    },
  };
}
