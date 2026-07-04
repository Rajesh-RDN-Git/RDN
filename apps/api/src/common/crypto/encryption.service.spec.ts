import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from './encryption.service';

/** Build a service with fresh 32-byte test keys. */
function buildService(overrides: Record<string, string | undefined> = {}): EncryptionService {
  const values: Record<string, string | undefined> = {
    'crypto.aesKey': randomBytes(32).toString('base64'),
    'crypto.blindIndexKey': randomBytes(32).toString('base64'),
    ...overrides,
  };
  const config = { get: (key: string) => values[key] } as unknown as ConfigService;
  return new EncryptionService(config);
}

describe('EncryptionService', () => {
  describe('encrypt / decrypt', () => {
    it('round-trips a plaintext value', () => {
      const svc = buildService();
      const cipher = svc.encrypt('+919999900001');
      expect(cipher).not.toBe('+919999900001');
      expect(svc.decrypt(cipher)).toBe('+919999900001');
    });

    it('tags ciphertext with the v1 key version', () => {
      const svc = buildService();
      expect(svc.encrypt('secret')).toMatch(/^v1:/);
    });

    it('produces a different ciphertext each call (random IV)', () => {
      const svc = buildService();
      expect(svc.encrypt('same')).not.toBe(svc.encrypt('same'));
    });

    it('throws when ciphertext is tampered with', () => {
      const svc = buildService();
      const cipher = svc.encrypt('secret');
      const tampered = cipher.slice(0, -2) + (cipher.endsWith('A') ? 'BB' : 'AA');
      expect(() => svc.decrypt(tampered)).toThrow();
    });

    it('passes through a value that is not v1-tagged (migration safety)', () => {
      const svc = buildService();
      expect(svc.decrypt('+919999900001')).toBe('+919999900001');
    });

    it('round-trips empty string and unicode', () => {
      const svc = buildService();
      expect(svc.decrypt(svc.encrypt(''))).toBe('');
      expect(svc.decrypt(svc.encrypt('नमस्ते 🙏'))).toBe('नमस्ते 🙏');
    });

    it('cannot decrypt ciphertext made with a different key', () => {
      const a = buildService();
      const b = buildService();
      expect(() => b.decrypt(a.encrypt('secret'))).toThrow();
    });
  });

  describe('blindIndex', () => {
    it('is deterministic for the same input', () => {
      const svc = buildService();
      expect(svc.blindIndex('+919999900001')).toBe(svc.blindIndex('+919999900001'));
    });

    it('returns a 64-char hex digest', () => {
      const svc = buildService();
      expect(svc.blindIndex('+919999900001')).toMatch(/^[0-9a-f]{64}$/);
    });

    it('normalizes equivalent phone forms to the same hash', () => {
      const svc = buildService();
      const canonical = svc.blindIndex('+919999900001');
      expect(svc.blindIndex('+91 99999 00001')).toBe(canonical);
      expect(svc.blindIndex('+91-99999-00001')).toBe(canonical);
      expect(svc.blindIndex('919999900001')).toBe(canonical);
      expect(svc.blindIndex('9999900001')).toBe(canonical);
    });

    it('yields different hashes for different phones', () => {
      const svc = buildService();
      expect(svc.blindIndex('+919999900001')).not.toBe(svc.blindIndex('+919999900002'));
    });

    it('depends on the blind-index key', () => {
      const a = buildService();
      const b = buildService();
      expect(a.blindIndex('+919999900001')).not.toBe(b.blindIndex('+919999900001'));
    });
  });

  describe('isEncrypted', () => {
    it('detects v1-tagged ciphertext', () => {
      const svc = buildService();
      expect(svc.isEncrypted(svc.encrypt('x'))).toBe(true);
      expect(svc.isEncrypted('+919999900001')).toBe(false);
    });
  });

  describe('key validation', () => {
    it('throws when the AES key is not 32 bytes', () => {
      expect(() => buildService({ 'crypto.aesKey': randomBytes(16).toString('base64') })).toThrow();
    });

    it('throws when a key is missing', () => {
      expect(() => buildService({ 'crypto.blindIndexKey': undefined })).toThrow();
    });
  });
});
