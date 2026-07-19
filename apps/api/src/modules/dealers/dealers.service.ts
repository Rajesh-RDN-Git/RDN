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

  async findOne(id: string, caller?: { id: string; role: string }) {
    const dealer = await this.prisma.dealer.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        society: { select: { id: true, name: true, slug: true, city: true } },
        _count: { select: { leads: true, commissions: true, assignedProperties: true } },
      },
    });

    if (!dealer) throw new NotFoundException('Dealer not found');

    // bankAccountDetails is auto-decrypted by the DB middleware; only the owning
    // dealer or a SUPER_ADMIN may see it. Everyone else gets it stripped.
    const isOwner = caller?.id === dealer.user?.id;
    if (caller?.role !== 'SUPER_ADMIN' && !isOwner) {
      const { bankAccountDetails: _omit, ...rest } = dealer as typeof dealer & {
        bankAccountDetails?: unknown;
      };
      return rest;
    }
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

    const dealer = await this.prisma.dealer.create({
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

    // Alert the society's approver(s) so the application doesn't sit unseen.
    // Falls back to all SUPER_ADMINs when the society has no RWA admin.
    this.notificationsService
      .notifySocietyApprovers(data.societyId, {
        type: 'SYSTEM',
        title: 'New Dealer Application',
        body: `${dealer.user.name} applied to be a dealer in ${dealer.society.name}.`,
        channel: 'IN_APP',
        data: { dealerId: dealer.id, societyId: data.societyId },
      })
      .catch(() => {});

    return dealer;
  }

  // SUPER_ADMIN onboards a dealer directly. Finds or creates the user for the
  // given phone, then creates a PENDING dealer (same lifecycle as self-apply).
  async createByAdmin(data: {
    name: string;
    phone: string;
    email?: string;
    societyId: string;
    bankAccountDetails?: Record<string, unknown>;
  }) {
    const society = await this.prisma.society.findUnique({ where: { id: data.societyId } });
    if (!society) throw new NotFoundException('Society not found');

    const phone = data.phone.trim();
    const email = data.email?.trim() ? data.email.trim() : undefined;

    if (email) {
      const emailOwner = await this.prisma.user.findUnique({ where: { email } });
      if (emailOwner && emailOwner.phone !== phone) {
        throw new ConflictException('Email already in use by another account');
      }
    }

    // Find or create the user behind this phone. (findFirst — phone is not a unique
    // column anymore; the Prisma middleware remaps this to the phoneHash blind index.)
    let user = await this.prisma.user.findFirst({ where: { phone } });
    if (!user) {
      user = await this.prisma.user.create({
        data: { phone, name: data.name.trim(), email, role: 'DEALER' },
      });
    } else if (user.role === 'BUYER_TENANT') {
      // Promote a browse-only account to a dealer.
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { role: 'DEALER', name: user.name === 'New User' ? data.name.trim() : user.name },
      });
    }

    const existing = await this.prisma.dealer.findUnique({
      where: { userId_societyId: { userId: user.id, societyId: data.societyId } },
    });
    if (existing) throw new ConflictException('This person is already a dealer for this society');

    const dealer = await this.prisma.dealer.create({
      data: {
        userId: user.id,
        societyId: data.societyId,
        bankAccountDetails: (data.bankAccountDetails ?? undefined) as any,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        society: { select: { id: true, name: true, slug: true } },
        _count: { select: { leads: true, commissions: true } },
      },
    });

    return dealer;
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

    if (updated.isActive && !dealer.isActive) {
      await this.claimUnassignedLeads(updated.id, dealer.societyId);
    }

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
    const updated = await this.prisma.dealer.update({
      where: { id },
      data: {
        kycStatus: kycStatus as any,
        isActive:
          kycStatus === 'APPROVED' &&
          dealer.rwaApprovalStatus === 'APPROVED' &&
          dealer.trainingStatus === 'COMPLETED',
      },
    });

    if (updated.isActive && !dealer.isActive) {
      await this.claimUnassignedLeads(updated.id, dealer.societyId);
    }

    return updated;
  }

  async completeTraining(id: string) {
    const dealer = await this.prisma.dealer.findUnique({ where: { id } });
    if (!dealer) throw new NotFoundException('Dealer not found');

    const updated = await this.prisma.dealer.update({
      where: { id },
      data: {
        trainingStatus: 'COMPLETED',
        isActive: dealer.kycStatus === 'APPROVED' && dealer.rwaApprovalStatus === 'APPROVED',
      },
    });

    if (updated.isActive && !dealer.isActive) {
      await this.claimUnassignedLeads(updated.id, dealer.societyId);
    }

    return updated;
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

    const updated = await this.prisma.dealer.update({ where: { id }, data: { isActive } });

    if (updated.isActive && !dealer.isActive) {
      await this.claimUnassignedLeads(updated.id, dealer.societyId);
    }

    return updated;
  }

  /**
   * When a dealer becomes active, assign it any enquiries in its society that were
   * queued while no active dealer existed (lead.dealerId = null). Best-effort:
   * notification failures never block activation.
   */
  private async claimUnassignedLeads(dealerId: string, societyId: string): Promise<void> {
    const result = await this.prisma.lead.updateMany({
      where: { societyId, dealerId: null },
      data: { dealerId },
    });
    if (result.count === 0) return;

    const dealer = await this.prisma.dealer.findUnique({
      where: { id: dealerId },
      select: { userId: true },
    });
    if (dealer) {
      this.notificationsService
        .create({
          userId: dealer.userId,
          type: 'LEAD',
          title: 'Pending enquiries assigned',
          body: `${result.count} enquiry(ies) in your society were assigned to you.`,
          channel: 'IN_APP',
          data: { count: result.count },
        })
        .catch(() => {});
    }
  }

  // Certify a resident dealer. Only available for dealers who have completed
  // training and whose society is verified.
  async certify(id: string) {
    const dealer = await this.prisma.dealer.findUnique({
      where: { id },
      include: { society: { select: { verificationStatus: true } } },
    });
    if (!dealer) throw new NotFoundException('Dealer not found');
    if (dealer.society.verificationStatus !== 'VERIFIED') {
      throw new BadRequestException('Only dealers in a verified society can be certified');
    }
    if (dealer.trainingStatus !== 'COMPLETED') {
      throw new BadRequestException('Dealer must complete training before certification');
    }
    return this.prisma.dealer.update({
      where: { id },
      data: { certificationStatus: 'CERTIFIED', certifiedAt: new Date() },
    });
  }

  async revokeCertification(id: string) {
    const dealer = await this.prisma.dealer.findUnique({ where: { id } });
    if (!dealer) throw new NotFoundException('Dealer not found');
    return this.prisma.dealer.update({
      where: { id },
      data: { certificationStatus: 'REVOKED' },
    });
  }
}
