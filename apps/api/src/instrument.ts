// Sentry must be initialized before anything else is imported.
// This file is imported at the very top of main.ts.
// No-op when SENTRY_DSN is unset (local/dev), so it is safe to always import.
import * as Sentry from '@sentry/nestjs';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    // Sample 10% of transactions in prod; full in non-prod.
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });
}
