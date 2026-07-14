import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from './encryption.service';
import { decryptResult, encryptWriteData, isWriteAction, remapWhere } from '@rdn/db';

function buildEnc(): EncryptionService {
  const values: Record<string, string> = {
    'crypto.aesKey': randomBytes(32).toString('base64'),
    'crypto.blindIndexKey': randomBytes(32).toString('base64'),
  };
  const config = { get: (k: string) => values[k] } as unknown as ConfigService;
  return new EncryptionService(config);
}

describe('field-encryption', () => {
  let enc: EncryptionService;
  beforeEach(() => {
    enc = buildEnc();
  });

  describe('encryptWriteData', () => {
    it('encrypts the phone and derives the blind index', () => {
      const data: Record<string, any> = { phone: '+919999900001', name: 'A' };
      encryptWriteData('User', data, enc);

      expect(enc.isEncrypted(data.phone)).toBe(true);
      expect(enc.decrypt(data.phone)).toBe('+919999900001');
      expect(data.phoneHash).toBe(enc.blindIndex('+919999900001'));
      expect(data.name).toBe('A'); // untouched
    });

    it('JSON-encodes and encrypts bank details', () => {
      const data: Record<string, any> = { bankAccountDetails: { acc: '123', ifsc: 'X' } };
      encryptWriteData('Dealer', data, enc);

      expect(enc.isEncrypted(data.bankAccountDetails)).toBe(true);
      expect(JSON.parse(enc.decrypt(data.bankAccountDetails))).toEqual({ acc: '123', ifsc: 'X' });
    });

    it('is idempotent — does not double-encrypt', () => {
      const data: Record<string, any> = { phone: '+919999900001' };
      encryptWriteData('User', data, enc);
      const once = data.phone;
      encryptWriteData('User', data, enc);
      expect(data.phone).toBe(once);
    });

    it('skips null/undefined fields', () => {
      const data: Record<string, any> = { phone: '+919999900001', nomineePhone: null };
      encryptWriteData('User', data, enc);
      expect(data.nomineePhone).toBeNull();
    });

    it('respects an explicit hash opt-out (anonymization)', () => {
      const data: Record<string, any> = { phone: 'deleted-x@rdn.local', phoneHash: null };
      encryptWriteData('User', data, enc);
      expect(data.phoneHash).toBeNull();
      expect(enc.isEncrypted(data.phone)).toBe(true);
    });

    it('ignores unconfigured models', () => {
      const data: Record<string, any> = { phone: '+919999900001' };
      encryptWriteData('Society', data, enc);
      expect(data.phone).toBe('+919999900001');
    });
  });

  describe('remapWhere', () => {
    it('rewrites a plaintext phone equality to the blind index', () => {
      const where: Record<string, any> = { phone: '+919999900001' };
      remapWhere('User', where, enc);
      expect(where.phone).toBeUndefined();
      expect(where.phoneHash).toBe(enc.blindIndex('+919999900001'));
    });

    it('handles the { equals } form', () => {
      const where: Record<string, any> = { phone: { equals: '+919999900001' } };
      remapWhere('User', where, enc);
      expect(where.phoneHash).toBe(enc.blindIndex('+919999900001'));
    });

    it('leaves non-equality filters (contains) alone', () => {
      const where: Record<string, any> = { phone: { contains: '9999' } };
      remapWhere('User', where, enc);
      expect(where.phone).toEqual({ contains: '9999' });
      expect(where.phoneHash).toBeUndefined();
    });
  });

  describe('decryptResult', () => {
    it('decrypts a top-level field', () => {
      const row = { id: '1', phone: enc.encrypt('+919999900001') };
      decryptResult(row, enc);
      expect(row.phone).toBe('+919999900001');
    });

    it('decrypts nested relations (arrays and objects)', () => {
      const result = {
        id: 'c1',
        dealer: { id: 'd1', bankAccountDetails: enc.encrypt(JSON.stringify({ acc: '1' })) },
        leads: [{ contactPhone: enc.encrypt('+919999900002') }],
      };
      decryptResult(result, enc);
      expect(result.dealer.bankAccountDetails).toEqual({ acc: '1' });
      expect(result.leads[0].contactPhone).toBe('+919999900002');
    });

    it('passes through plaintext (non-v1) values untouched', () => {
      const row = { phone: '+919999900001', contact: 'legacy' };
      decryptResult(row, enc);
      expect(row.phone).toBe('+919999900001');
      expect(row.contact).toBe('legacy');
    });

    it('handles null and primitives', () => {
      expect(decryptResult(null, enc)).toBeNull();
      expect(decryptResult(42, enc)).toBe(42);
    });
  });

  describe('isWriteAction', () => {
    it('classifies write vs read actions', () => {
      expect(isWriteAction('create')).toBe(true);
      expect(isWriteAction('upsert')).toBe(true);
      expect(isWriteAction('findFirst')).toBe(false);
    });
  });
});
