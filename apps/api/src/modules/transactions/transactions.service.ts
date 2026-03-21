import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { CreateTransactionDto } from './dto/create-transaction.dto';
import type { QueryTransactionsDto } from './dto/query-transactions.dto';
import type { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import type { Prisma } from '@rdn/db';
import {
  calculateRentCommission,
  calculateSaleCommission,
  calculateGST,
  splitCommission,
} from '@rdn/shared';

// Commission split percentages: RDN 40%, Dealer 50%, RWA 10%
const RDN_PERCENTAGE = 0.4;
const DEALER_PERCENTAGE = 0.5;
const RWA_PERCENTAGE = 0.1;

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(data: CreateTransactionDto): Promise<any> {
    // Fetch lead with relations
    const lead = await this.prisma.lead.findUnique({
      where: { id: data.leadId },
      include: {
        property: true,
        dealer: { include: { user: true } },
        buyer: true,
      },
    });

    if (!lead) throw new NotFoundException('Lead not found');
    if (lead.status !== 'CLOSED') {
      throw new BadRequestException('Lead must be in CLOSED status to create a transaction');
    }

    // Calculate commissions
    const dealValue = Number(data.dealValue);
    let totalCommission: number;

    if (data.type === 'RENT' || data.type === 'RENEWAL') {
      totalCommission = calculateRentCommission(dealValue);
    } else {
      totalCommission = calculateSaleCommission(dealValue);
    }

    const gstAmount = calculateGST(totalCommission);
    const { rdnShare, dealerShare, rwaShare } = splitCommission(
      totalCommission,
      RDN_PERCENTAGE,
      DEALER_PERCENTAGE,
      RWA_PERCENTAGE,
    );

    const dealerGst = calculateGST(dealerShare);

    // Create transaction and commission in a DB transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          leadId: data.leadId,
          propertyId: lead.propertyId,
          type: data.type as any,
          dealValue: dealValue,
          buyerCommission: 0,
          sellerCommission: totalCommission,
          gstAmount: gstAmount,
          rdnShare: rdnShare,
          dealerShare: dealerShare,
          rwaShare: rwaShare,
          paymentStatus: 'PENDING',
          closedAt: new Date(),
        },
      });

      const commission = await tx.commission.create({
        data: {
          dealerId: lead.dealerId,
          transactionId: transaction.id,
          amount: dealerShare,
          gst: dealerGst,
          status: 'PENDING',
        },
      });

      // Update property availability if sale
      if (data.type === 'SALE') {
        await tx.property.update({
          where: { id: lead.propertyId },
          data: {
            availabilityStatus: 'SOLD',
            status: 'CLOSED',
          },
        });
      } else {
        await tx.property.update({
          where: { id: lead.propertyId },
          data: { availabilityStatus: 'OCCUPIED' },
        });
      }

      return { transaction, commission };
    });

    // Trigger notifications (non-blocking)
    this.notificationsService
      .create({
        userId: lead.dealer.userId,
        type: 'DEAL',
        title: 'Deal Closed!',
        body: `Transaction of Rs ${dealValue.toLocaleString('en-IN')} completed. Your commission: Rs ${dealerShare.toLocaleString('en-IN')}`,
        channel: 'IN_APP',
        data: { transactionId: result.transaction.id, commissionId: result.commission.id },
      })
      .catch(() => {});

    this.notificationsService
      .create({
        userId: lead.buyerId,
        type: 'DEAL',
        title: 'Deal Confirmed',
        body: `Your ${data.type.toLowerCase()} deal has been confirmed.`,
        channel: 'IN_APP',
        data: { transactionId: result.transaction.id },
      })
      .catch(() => {});

    this.notificationsService
      .create({
        userId: lead.property.ownerId,
        type: 'DEAL',
        title: 'Property Deal Completed',
        body: `Your property ${lead.property.flatNumber}, ${lead.property.towerBlock} has been ${data.type === 'SALE' ? 'sold' : 'rented'}.`,
        channel: 'IN_APP',
        data: { transactionId: result.transaction.id, propertyId: lead.propertyId },
      })
      .catch(() => {});

    return result.transaction;
  }

  async findAll(query: QueryTransactionsDto): Promise<any> {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    const where: Prisma.TransactionWhereInput = {};
    if (query.type) where.type = query.type as any;
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus as any;
    if (query.societyId) {
      where.property = { societyId: query.societyId };
    }
    if (query.from || query.to) {
      where.closedAt = {};
      if (query.from) where.closedAt.gte = new Date(query.from);
      if (query.to) where.closedAt.lte = new Date(query.to);
    }

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { closedAt: 'desc' },
        include: {
          property: {
            select: {
              id: true,
              flatNumber: true,
              towerBlock: true,
              society: { select: { id: true, name: true } },
            },
          },
          lead: {
            select: {
              id: true,
              buyer: { select: { id: true, name: true } },
              dealer: { select: { id: true, user: { select: { id: true, name: true } } } },
            },
          },
          commissions: {
            select: { id: true, amount: true, status: true },
          },
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<any> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        property: {
          include: {
            society: { select: { id: true, name: true, slug: true } },
            owner: { select: { id: true, name: true } },
          },
        },
        lead: {
          include: {
            buyer: { select: { id: true, name: true } },
            dealer: { select: { id: true, user: { select: { id: true, name: true } } } },
          },
        },
        commissions: {
          include: {
            dealer: { select: { id: true, user: { select: { id: true, name: true } } } },
          },
        },
      },
    });

    if (!transaction) throw new NotFoundException('Transaction not found');
    return transaction;
  }

  async updatePaymentStatus(id: string, data: UpdatePaymentStatusDto): Promise<any> {
    const transaction = await this.prisma.transaction.findUnique({ where: { id } });
    if (!transaction) throw new NotFoundException('Transaction not found');

    return this.prisma.transaction.update({
      where: { id },
      data: { paymentStatus: data.paymentStatus as any },
    });
  }
}
