import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { formatPhone } from '@rdn/shared';
import type { QueryUsersDto } from './dto/query-users.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { Prisma } from '@rdn/db';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryUsersDto) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};
    if (query.role) where.role = query.role as Prisma.EnumRoleFilter['equals'];
    if (query.status) where.status = query.status as Prisma.EnumUserStatusFilter['equals'];

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          role: true,
          status: true,
          email: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
          // phone intentionally excluded from list view
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        role: true,
        status: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        // phone intentionally excluded from detail view
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        status: true,
        email: true,
        avatarUrl: true,
        primarySocietyId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return {
      ...user,
      phone: formatPhone(user.phone),
    };
  }

  async update(id: string, data: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        role: true,
        status: true,
        email: true,
        avatarUrl: true,
        updatedAt: true,
      },
    });
  }

  async deactivate(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id },
      data: { status: 'INACTIVE' },
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  /**
   * DPDP Section 11 data portability — bundles a user's primary records into JSON.
   * Returns a snapshot suitable for download. PII is intentionally NOT scrubbed here
   * because the data principal is requesting their own data.
   */
  async exportData(userId: string) {
    const [user, properties, leads, sentMessages, notifications, consents] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          phone: true,
          email: true,
          name: true,
          role: true,
          status: true,
          avatarUrl: true,
          primarySocietyId: true,
          nomineeName: true,
          nomineePhone: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.property.findMany({ where: { ownerId: userId } }),
      this.prisma.lead.findMany({ where: { buyerId: userId } }),
      this.prisma.message.findMany({ where: { senderId: userId } }),
      this.prisma.notification.findMany({ where: { userId } }),
      this.prisma.consentRecord.findMany({
        where: { userId },
        orderBy: { grantedAt: 'desc' },
      }),
    ]);

    if (!user) throw new NotFoundException('User not found');

    return {
      exportedAt: new Date().toISOString(),
      schema: 'rdn-data-export@1',
      user,
      properties,
      leads,
      sentMessages,
      notifications,
      consents,
    };
  }

  /**
   * DPDP Section 11 erasure + Apple App Store account-deletion requirement.
   * Soft-deletes the user, scrubs PII, cascades anonymization, removes device tokens.
   * Leads/transactions are retained for legal/audit (Section 8(7)) — separate retention job hard-purges later.
   */
  async deleteMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const anonymousPhone = `deleted-${userId}@rdn.local`;
    const anonymousName = 'Deleted User';

    await this.prisma.$transaction([
      this.prisma.deviceToken.deleteMany({ where: { userId } }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          status: 'INACTIVE',
          name: anonymousName,
          phone: anonymousPhone,
          // clear the blind index so the anonymized row can't be found by the old phone
          // (and to avoid a unique-collision — the tombstone has no phone digits to hash)
          phoneHash: null,
          email: null,
          avatarUrl: null,
          otpHash: null,
          otpExpiresAt: null,
          refreshToken: null,
        },
      }),
    ]);

    return { ok: true, deletedAt: new Date().toISOString() };
  }
}
