import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const PII_KEYS = new Set([
  'phone',
  'email',
  'otp',
  'token',
  'accessToken',
  'refreshToken',
  'password',
]);

function scrubPii(obj: unknown, depth = 0): unknown {
  if (depth > 6 || obj == null) return obj;
  if (Array.isArray(obj)) return obj.map((v) => scrubPii(v, depth + 1));
  if (typeof obj !== 'object') return obj;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (PII_KEYS.has(k)) {
      out[k] = '[redacted]';
    } else {
      out[k] = scrubPii(v, depth + 1);
    }
  }
  return out;
}

export function initSentry() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    // eslint-disable-next-line no-console
    console.log('[sentry] DSN not set — skipping init (dev mode)');
    return;
  }
  Sentry.init({
    dsn,
    environment: process.env.EXPO_PUBLIC_ENV || 'development',
    release: Constants.expoConfig?.version,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request?.data) event.request.data = scrubPii(event.request.data) as never;
      if (event.extra) event.extra = scrubPii(event.extra) as Record<string, unknown>;
      if (event.contexts) event.contexts = scrubPii(event.contexts) as never;
      if (event.user) {
        // keep id only; drop phone/email
        event.user = { id: event.user.id };
      }
      return event;
    },
  });
}

export const captureException = Sentry.captureException;
export const captureMessage = Sentry.captureMessage;
