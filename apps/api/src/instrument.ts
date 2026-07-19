// Sentry must be initialized before anything else is imported.
// This file is imported at the very top of main.ts.
// No-op when SENTRY_DSN is unset (local/dev), so it is safe to always import.
import * as Sentry from '@sentry/nestjs';
import { scrubPii } from './common/utils/pii-scrub';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    // Sample 10% of transactions in prod; full in non-prod.
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Never ship user PII (phone/OTP/bank) to Sentry: opt out of default PII and
    // recursively redact known-sensitive keys from every outgoing event.
    sendDefaultPii: false,
    beforeSend: (event) => scrubPii(event),
  });
}
