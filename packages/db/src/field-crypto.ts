import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'crypto';

/**
 * Canonical field-encryption primitives for DPDP-sensitive PII (phone/KYC/bank).
 * Lives in @rdn/db (server-only, never bundled by the web app) so the API's
 * EncryptionService, DB seeds, and the backfill script all share ONE algorithm and
 * key handling — no drift between what encrypts data and what reads it back.
 *
 * Format: `v1:base64(iv || authTag || ciphertext)`. `v1:` is a key-version tag for
 * future rotation. Blind index = HMAC-SHA256 over a normalized value (deterministic,
 * used for equality lookups such as login-by-phone).
 */

export const KEY_VERSION = 'v1';
const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const TAG_BYTES = 16;
export const KEY_BYTES = 32;

/** Deterministic 32-byte dev key from a seed — mirrors apps/api crypto.config fallback. */
const devKey = (seed: string): string =>
  Buffer.from(seed.padEnd(32, '0').slice(0, 32)).toString('base64');

/** Decode + validate a base64 32-byte key. Throws if missing or wrong length. */
export function loadKey(value: string | undefined, name: string): Buffer {
  if (!value) throw new Error(`${name} must be set — refusing to start.`);
  const key = Buffer.from(value, 'base64');
  if (key.length !== KEY_BYTES) {
    throw new Error(`${name} must decode to ${KEY_BYTES} bytes (got ${key.length}).`);
  }
  return key;
}

/**
 * Resolve the field keys from env, falling back to the SAME deterministic dev keys the
 * API uses (apps/api/src/config/crypto.config.ts) so local seeds encrypt with keys the
 * running API can decrypt. In production the env vars are required (fail-fast).
 */
export function getFieldKeys(): { aesKey: Buffer; blindIndexKey: Buffer } {
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd && (!process.env.AES_ENCRYPTION_KEY || !process.env.BLIND_INDEX_KEY)) {
    throw new Error('AES_ENCRYPTION_KEY and BLIND_INDEX_KEY must be set in production.');
  }
  return {
    aesKey: loadKey(
      process.env.AES_ENCRYPTION_KEY || devKey('rdn-dev-aes-encryption-key'),
      'AES_ENCRYPTION_KEY',
    ),
    blindIndexKey: loadKey(
      process.env.BLIND_INDEX_KEY || devKey('rdn-dev-blind-index-key'),
      'BLIND_INDEX_KEY',
    ),
  };
}

export function isEncrypted(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith(`${KEY_VERSION}:`);
}

export function encryptField(plaintext: string, aesKey: Buffer): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, aesKey, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${KEY_VERSION}:${Buffer.concat([iv, authTag, ciphertext]).toString('base64')}`;
}

export function decryptField(payload: string, aesKey: Buffer): string {
  if (!isEncrypted(payload)) return payload; // legacy plaintext — pass through
  const packed = Buffer.from(payload.slice(KEY_VERSION.length + 1), 'base64');
  const iv = packed.subarray(0, IV_BYTES);
  const authTag = packed.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const ciphertext = packed.subarray(IV_BYTES + TAG_BYTES);
  const decipher = createDecipheriv(ALGORITHM, aesKey, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

/** Canonicalize a phone so equivalent forms hash identically (Indian E.164). */
export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return `+${digits}`;
}

export function blindIndex(value: string, blindIndexKey: Buffer): string {
  return createHmac('sha256', blindIndexKey).update(normalizePhone(value)).digest('hex');
}
