import type { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { PrismaClient, applyFieldEncryption } from '@rdn/db';
import { EncryptionService } from '../common/crypto/encryption.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly encryption: EncryptionService) {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // Transparent field encryption for DPDP-sensitive PII: encrypt on write (+ populate
    // blind-index columns), remap plaintext equality lookups to the blind index, and
    // decrypt on read. EncryptionService satisfies the FieldCipher interface.
    applyFieldEncryption(this, this.encryption);
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
