import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { QueryCommissionsDto } from './dto/query-commissions.dto';
import type { SettleCommissionDto } from './dto/settle-commission.dto';
import type { CancelCommissionDto } from './dto/cancel-commission.dto';
import type { Prisma } from '@rdn/db';

@Injectable()
export class CommissionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(query: QueryCommissionsDto): Promise<any> {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    const where: Prisma.CommissionWhereInput = {};
    if (query.dealerId) where.dealerId = query.dealerId;
    if (query.status) where.status = query.status as any;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    const [data, total] = await Promise.all([
      this.prisma.commission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          dealer: {
            select: { id: true, user: { select: { id: true, name: true } } },
          },
          transaction: {
            select: {
              id: true,
              type: true,
              dealValue: true,
              property: { select: { id: true, flatNumber: true, towerBlock: true } },
            },
          },
        },
      }),
      this.prisma.commission.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<any> {
    const commission = await this.prisma.commission.findUnique({
      where: { id },
      include: {
        dealer: {
          select: {
            id: true,
            bankAccountDetails: true,
            user: { select: { id: true, name: true } },
          },
        },
        transaction: {
          include: {
            property: { select: { id: true, flatNumber: true, towerBlock: true } },
            lead: { select: { id: true, source: true } },
          },
        },
      },
    });

    if (!commission) throw new NotFoundException('Commission not found');
    return commission;
  }

  async settle(id: string, data: SettleCommissionDto): Promise<any> {
    const commission = await this.prisma.commission.findUnique({
      where: { id },
      include: { dealer: true },
    });
    if (!commission) throw new NotFoundException('Commission not found');
    if (commission.status !== 'PENDING') {
      throw new BadRequestException(`Commission is already ${commission.status}`);
    }

    const updated = await this.prisma.commission.update({
      where: { id },
      data: {
        status: 'SETTLED',
        payoutReference: data.payoutReference,
        settlementDate: data.settlementDate ? new Date(data.settlementDate) : new Date(),
      },
    });

    this.notificationsService
      .create({
        userId: commission.dealer.userId,
        type: 'COMMISSION',
        title: 'Commission Settled',
        body: `Your commission of Rs ${Number(commission.amount).toLocaleString('en-IN')} has been settled. Ref: ${data.payoutReference || 'N/A'}`,
        channel: 'IN_APP',
        data: { commissionId: id },
      })
      .catch(() => {});

    return updated;
  }

  async distribute(id: string): Promise<any> {
    const commission = await this.prisma.commission.findUnique({
      where: { id },
      include: { dealer: true },
    });
    if (!commission) throw new NotFoundException('Commission not found');
    if (commission.status !== 'SETTLED') {
      throw new BadRequestException('Only a settled commission can be distributed');
    }

    const updated = await this.prisma.commission.update({
      where: { id },
      data: { status: 'DISTRIBUTED' },
    });

    this.notificationsService
      .create({
        userId: commission.dealer.userId,
        type: 'COMMISSION',
        title: 'Commission Distributed',
        body: `Your commission of Rs ${Number(commission.amount).toLocaleString('en-IN')} has been paid out.`,
        channel: 'IN_APP',
        data: { commissionId: id },
      })
      .catch(() => {});

    return updated;
  }

  async cancel(id: string, data: CancelCommissionDto = {}): Promise<any> {
    const commission = await this.prisma.commission.findUnique({ where: { id } });
    if (!commission) throw new NotFoundException('Commission not found');
    if (commission.status !== 'PENDING') {
      throw new BadRequestException(`Commission is already ${commission.status}`);
    }

    // Cancellations don't have a payout, so we reuse `payoutReference`
    // to persist the operator-supplied reason for audit purposes.
    return this.prisma.commission.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        ...(data.reason ? { payoutReference: `CANCELLED: ${data.reason}` } : {}),
      },
    });
  }
}
