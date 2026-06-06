import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { QueryDealersDto } from './dto/query-dealers.dto';
import type { ApplyDealerDto } from './dto/apply-dealer.dto';
import type { Prisma } from '@rdn/db';

@Injectable()
export class DealersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(query: QueryDealersDto, currentUserId?: string, currentUserRole?: string) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    const where: Prisma.DealerWhereInput = {};
    if (query.societyId) where.societyId = query.societyId;
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
    if (query.kycStatus) where.kycStatus = query.kycStatus as any;

    // Role-based scoping. SUPER_ADMIN sees all; RWA_ADMIN scoped to their societies;
    // DEALER can only see their own dealer record.
    if (currentUserRole === 'RWA_ADMIN' && currentUserId) {
      where.society = { rwaAdminId: currentUserId };
    } else if (currentUserRole === 'DEALER' && currentUserId) {
      where.userId = currentUserId;
    }

    const [data, total] = await Promise.all([
      this.prisma.dealer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          society: { select: { id: true, name: true, slug: true } },
          _count: { select: { leads: true, commissions: true } },
        },
      }),
      this.prisma.dealer.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const dealer = await this.prisma.dealer.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        society: { select: { id: true, name: true, slug: true, city: true } },
        _count: { select: { leads: true, commissions: true, assignedProperties: true } },
      },
    });

    if (!dealer) throw new NotFoundException('Dealer not found');
    return dealer;
  }

  async apply(data: ApplyDealerDto, userId: string) {
    // Check society exists
    const society = await this.prisma.society.findUnique({ where: { id: data.societyId } });
    if (!society) throw new NotFoundException('Society not found');

    // Check not already a dealer for this society
    const existing = await this.prisma.dealer.findUnique({
      where: { userId_societyId: { userId, societyId: data.societyId } },
    });
    if (existing) throw new ConflictException('Already applied as dealer for this society');

    return this.prisma.dealer.create({
      data: {
        userId,
        societyId: data.societyId,
        bankAccountDetails: (data.bankAccountDetails ?? undefined) as any,
      },
      include: {
        user: { select: { id: true, name: true } },
        society: { select: { id: true, name: true } },
      },
    });
  }

  async approve(id: string) {
    const dealer = await this.prisma.dealer.findUnique({ where: { id } });
    if (!dealer) throw new NotFoundException('Dealer not found');

    const updated = await this.prisma.dealer.update({
      where: { id },
      data: {
        rwaApprovalStatus: 'APPROVED',
        isActive: dealer.kycStatus === 'APPROVED' && dealer.trainingStatus === 'COMPLETED',
      },
    });

    this.notificationsService
      .create({
        userId: dealer.userId,
        type: 'SYSTEM',
        title: 'Dealer Application Approved',
        body: 'Your dealer application has been approved by the RWA.',
        channel: 'IN_APP',
        data: { dealerId: id },
      })
      .catch(() => {});

    return updated;
  }

  async reject(id: string) {
    const dealer = await this.prisma.dealer.findUnique({ where: { id } });
    if (!dealer) throw new NotFoundException('Dealer not found');

    const updated = await this.prisma.dealer.update({
      where: { id },
      data: { rwaApprovalStatus: 'REJECTED', isActive: false },
    });

    this.notificationsService
      .create({
        userId: dealer.userId,
        type: 'SYSTEM',
        title: 'Dealer Application Rejected',
        body: 'Your dealer application has been rejected. Please contact the RWA for details.',
        channel: 'IN_APP',
        data: { dealerId: id },
      })
      .catch(() => {});

    return updated;
  }

  async updateKyc(id: string, status: 'APPROVED' | 'REJECTED') {
    const dealer = await this.prisma.dealer.findUnique({ where: { id } });
    if (!dealer) throw new NotFoundException('Dealer not found');

    const kycStatus = status === 'APPROVED' ? 'APPROVED' : 'REJECTED';
    return this.prisma.dealer.update({
      where: { id },
      data: {
        kycStatus: kycStatus as any,
        isActive:
          kycStatus === 'APPROVED' &&
          dealer.rwaApprovalStatus === 'APPROVED' &&
          dealer.trainingStatus === 'COMPLETED',
      },
    });
  }

  async completeTraining(id: string) {
    const dealer = await this.prisma.dealer.findUnique({ where: { id } });
    if (!dealer) throw new NotFoundException('Dealer not found');

    return this.prisma.dealer.update({
      where: { id },
      data: {
        trainingStatus: 'COMPLETED',
        isActive: dealer.kycStatus === 'APPROVED' && dealer.rwaApprovalStatus === 'APPROVED',
      },
    });
  }

  // SUPER_ADMIN explicit activate/deactivate. Reactivating requires the dealer
  // to have cleared KYC + RWA approval + training.
  async setActive(id: string, isActive: boolean) {
    const dealer = await this.prisma.dealer.findUnique({ where: { id } });
    if (!dealer) throw new NotFoundException('Dealer not found');

    if (isActive) {
      const eligible =
        dealer.kycStatus === 'APPROVED' &&
        dealer.rwaApprovalStatus === 'APPROVED' &&
        dealer.trainingStatus === 'COMPLETED';
      if (!eligible) {
        throw new BadRequestException(
          'Dealer must clear KYC, RWA approval and training before activation',
        );
      }
    }

    return this.prisma.dealer.update({ where: { id }, data: { isActive } });
  }
}
