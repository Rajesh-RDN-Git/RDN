/**
 * Recursively scrubs known PII fields from any structured value before logging.
 * DPDP-compliance helper. Use whenever a body, header, or error payload is logged.
 */
const PII_KEYS = new Set([
  'phone',
  'email',
  'otp',
  'otpHash',
  'token',
  'accessToken',
  'refreshToken',
  'password',
  'aadhaar',
  'pan',
  'bankAccountDetails',
  'authorization',
]);

const MAX_DEPTH = 6;

export function scrubPii<T>(value: T, depth = 0): T {
  if (value == null || depth > MAX_DEPTH) return value;
  if (Array.isArray(value)) return value.map((v) => scrubPii(v, depth + 1)) as unknown as T;
  if (typeof value !== 'object') return value;

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (PII_KEYS.has(k.toLowerCase())) {
      out[k] = '[redacted]';
    } else {
      out[k] = scrubPii(v, depth + 1);
    }
  }
  return out as T;
}
