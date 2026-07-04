import { registerAs } from '@nestjs/config';

/** Build a deterministic 32-byte dev key from a seed (never used in production). */
const devKey = (seed: string): string =>
  Buffer.from(seed.padEnd(32, '0').slice(0, 32)).toString('base64');

export default registerAs('crypto', () => {
  const isProd = process.env.NODE_ENV === 'production';

  // In production the field-encryption keys MUST come from env (AWS Secrets Manager).
  // Never fall back to a known dev value — that would make PII trivially decryptable.
  if (isProd && (!process.env.AES_ENCRYPTION_KEY || !process.env.BLIND_INDEX_KEY)) {
    throw new Error(
      'AES_ENCRYPTION_KEY and BLIND_INDEX_KEY must be set in production — refusing to start.',
    );
  }

  return {
    aesKey: process.env.AES_ENCRYPTION_KEY || devKey('rdn-dev-aes-encryption-key'),
    blindIndexKey: process.env.BLIND_INDEX_KEY || devKey('rdn-dev-blind-index-key'),
  };
});
