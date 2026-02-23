import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { QueryReferralsDto } from './dto/query-referrals.dto';
import type { Prisma } from '@rdn/db';

@Injectable()
export class ReferralService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryReferralsDto, userId: string): Promise<any> {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    const where: Prisma.ReferralWhereInput = { referrerId: userId };
    if (query.status) where.status = query.status as any;

    const [data, total] = await Promise.all([
      this.prisma.referral.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          referred: { select: { id: true, name: true } },
        },
      }),
      this.prisma.referral.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async generateCode(userId: string): Promise<any> {
    // Check if user already has an active referral code
    const existing = await this.prisma.referral.findFirst({
      where: { referrerId: userId, status: 'PENDING', referredId: null },
    });
    if (existing) return { code: existing.referralCode, id: existing.id };

    // Generate unique code: RDN-XXXXXX
    const code = `RDN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const referral = await this.prisma.referral.create({
      data: {
        referrerId: userId,
        referralCode: code,
        status: 'PENDING',
      },
    });

    return { code: referral.referralCode, id: referral.id };
  }

  async validateCode(code: string): Promise<any> {
    const referral = await this.prisma.referral.findUnique({
      where: { referralCode: code },
      include: {
        referrer: { select: { id: true, name: true } },
      },
    });

    if (!referral) throw new NotFoundException('Invalid referral code');

    return {
      valid: true,
      code: referral.referralCode,
      referrer: referral.referrer,
    };
  }

  async applyCode(code: string, referredUserId: string): Promise<any> {
    const referral = await this.prisma.referral.findUnique({
      where: { referralCode: code },
    });

    if (!referral) throw new NotFoundException('Invalid referral code');
    if (referral.referrerId === referredUserId) {
      throw new ConflictException('Cannot use your own referral code');
    }
    if (referral.referredId) {
      throw new ConflictException('Referral code already used');
    }

    return this.prisma.referral.update({
      where: { id: referral.id },
      data: {
        referredId: referredUserId,
        status: 'SIGNED_UP',
      },
    });
  }
}
