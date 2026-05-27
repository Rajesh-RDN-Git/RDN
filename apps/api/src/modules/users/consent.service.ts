import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { GrantConsentDto } from './dto/consent.dto';

@Injectable()
export class ConsentService {
  constructor(private readonly prisma: PrismaService) {}

  async grantOrWithdraw(userId: string, dto: GrantConsentDto, ip?: string) {
    // Append-only ledger: every change creates a new row.
    const record = await this.prisma.consentRecord.create({
      data: {
        userId,
        purpose: dto.purpose,
        granted: dto.granted,
        policyVersion: dto.policyVersion,
        ip: ip ?? null,
        userAgent: dto.userAgent ?? null,
        withdrawnAt: dto.granted ? null : new Date(),
      },
    });
    return record;
  }

  async current(userId: string) {
    // Latest decision per purpose
    const rows = await this.prisma.consentRecord.findMany({
      where: { userId },
      orderBy: { grantedAt: 'desc' },
    });
    const latest: Record<string, (typeof rows)[number]> = {};
    for (const r of rows) {
      if (!latest[r.purpose]) latest[r.purpose] = r;
    }
    return Object.values(latest);
  }

  async history(userId: string) {
    return this.prisma.consentRecord.findMany({
      where: { userId },
      orderBy: { grantedAt: 'desc' },
    });
  }
}
