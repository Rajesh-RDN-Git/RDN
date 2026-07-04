import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { blindIndex, decryptField, encryptField, isEncrypted, loadKey } from '@rdn/db';

/**
 * Application-level field encryption for DPDP-sensitive PII (phone, KYC, bank).
 * Thin NestJS wrapper over the canonical primitives in `@rdn/db` (field-crypto),
 * binding the AES + blind-index keys loaded from config (AWS Secrets Manager in prod).
 * Seeds + the backfill script use the same `@rdn/db` primitives, so there is one
 * algorithm across everything that reads or writes encrypted fields.
 */
@Injectable()
export class EncryptionService {
  private readonly aesKey: Buffer;
  private readonly blindIndexKey: Buffer;

  constructor(config: ConfigService) {
    this.aesKey = loadKey(config.get<string>('crypto.aesKey'), 'AES_ENCRYPTION_KEY');
    this.blindIndexKey = loadKey(config.get<string>('crypto.blindIndexKey'), 'BLIND_INDEX_KEY');
  }

  encrypt(plaintext: string): string {
    return encryptField(plaintext, this.aesKey);
  }

  decrypt(payload: string): string {
    return decryptField(payload, this.aesKey);
  }

  blindIndex(value: string): string {
    return blindIndex(value, this.blindIndexKey);
  }

  isEncrypted(value: string): boolean {
    return isEncrypted(value);
  }
}
