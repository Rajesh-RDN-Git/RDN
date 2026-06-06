import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { QueryLeadsDto } from './dto/query-leads.dto';
import type { CreateLeadDto } from './dto/create-lead.dto';
import type { UpdateLeadDto } from './dto/update-lead.dto';
import type { CloseDealDto } from './dto/close-deal.dto';
import type { Prisma } from '@rdn/db';

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionsService: TransactionsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(query: QueryLeadsDto, userId: string, userRole: string) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    const where: Prisma.LeadWhereInput = {};
    if (query.propertyId) where.propertyId = query.propertyId;
    if (query.societyId) where.societyId = query.societyId;
    if (query.dealerId) where.dealerId = query.dealerId;
    if (query.status) where.status = query.status as any;
    if (query.source) where.source = query.source as any;

    // Scope by role
    if (userRole === 'DEALER') {
      where.dealer = { userId };
    } else if (userRole === 'BUYER_TENANT') {
      where.buyerId = userId;
    } else if (userRole === 'OWNER') {
      where.property = { ownerId: userId };
    } else if (userRole === 'RWA_ADMIN') {
      // RWA admins only see leads within the societies they manage.
      const societies = await this.prisma.society.findMany({
        where: { rwaAdminId: userId },
        select: { id: true },
      });
      where.societyId = { in: societies.map((s) => s.id) };
    }

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          property: {
            select: {
              id: true,
              flatNumber: true,
              towerBlock: true,
              type: true,
              transactionType: true,
              priceRent: true,
              priceSale: true,
            },
          },
          buyer: { select: { id: true, name: true } },
          dealer: {
            select: { id: true, user: { select: { id: true, name: true } } },
          },
          society: { select: { id: true, name: true } },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        property: {
          include: {
            society: { select: { id: true, name: true, slug: true } },
            media: { take: 3, orderBy: { order: 'asc' } },
          },
        },
        buyer: { select: { id: true, name: true } },
        dealer: {
          select: { id: true, user: { select: { id: true, name: true } } },
        },
        society: { select: { id: true, name: true } },
      },
    });

    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async create(data: CreateLeadDto, buyerId: string) {
    // Get property with society and assigned dealer
    const property = await this.prisma.property.findUnique({
      where: { id: data.propertyId },
      include: { assignedDealer: true },
    });

    if (!property) throw new NotFoundException('Property not found');
    if (property.status !== 'ACTIVE') {
      throw new BadRequestException('Property is not available');
    }

    // Find an active dealer for this society
    let dealerId: string;
    if (property.assignedDealerId) {
      dealerId = property.assignedDealerId;
    } else {
      // Auto-assign to first active dealer in the society
      const dealer = await this.prisma.dealer.findFirst({
        where: { societyId: property.societyId, isActive: true },
      });
      if (!dealer) {
        throw new BadRequestException('No active dealer available for this society');
      }
      dealerId = dealer.id;
    }

    const lead = await this.prisma.lead.create({
      data: {
        propertyId: data.propertyId,
        buyerId,
        dealerId,
        societyId: property.societyId,
        source: data.source as any,
      },
      include: {
        property: { select: { id: true, flatNumber: true, towerBlock: true } },
        dealer: { select: { id: true, user: { select: { id: true, name: true } } } },
      },
    });

    // Notify dealer about new lead
    if (lead.dealer?.user?.id) {
      this.notificationsService
        .create({
          userId: lead.dealer.user.id,
          type: 'LEAD',
          title: 'New Lead Assigned',
          body: `New enquiry for ${lead.property.flatNumber}, ${lead.property.towerBlock}`,
          channel: 'IN_APP',
          data: { leadId: lead.id, propertyId: data.propertyId },
        })
        .catch(() => {});
    }

    // Notify owner about visit request
    this.notificationsService
      .create({
        userId: property.ownerId,
        type: 'LEAD',
        title: 'New Enquiry on Your Property',
        body: `Someone is interested in your property at ${lead.property.flatNumber}, ${lead.property.towerBlock}`,
        channel: 'IN_APP',
        data: { leadId: lead.id, propertyId: data.propertyId },
      })
      .catch(() => {});

    return lead;
  }

  async update(id: string, data: UpdateLeadDto) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');

    if (data.status === 'CLOSED') {
      throw new BadRequestException(
        'Use POST /leads/:id/close-deal to close — it creates the transaction, commission, and notifications.',
      );
    }

    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.visitDate) updateData.visitDate = new Date(data.visitDate);
    if (data.notes) {
      // Append new notes to existing notes array
      const currentNotes = Array.isArray(lead.notes) ? lead.notes : [];
      updateData.notes = [...(currentNotes as any[]), data.notes];
    }

    return this.prisma.lead.update({
      where: { id },
      data: updateData,
    });
  }

  async approveVisit(id: string, callerId: string, callerRole?: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!lead) throw new NotFoundException('Lead not found');
    // SUPER_ADMIN can approve on behalf of any owner; OWNER can only approve their own.
    const isSuperAdmin = callerRole === 'SUPER_ADMIN';
    if (!isSuperAdmin && lead.property.ownerId !== callerId) {
      throw new BadRequestException('Only the property owner can approve visits');
    }

    // A visit can only be approved once a dealer has actually scheduled one.
    if (lead.status !== 'VISIT_SCHEDULED') {
      throw new BadRequestException('No visit is awaiting approval for this lead');
    }

    return this.prisma.lead.update({
      where: { id },
      data: { visitApprovedByOwner: true },
    });
  }

  async closeDeal(id: string, data: CloseDealDto) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');

    if (lead.status !== 'NEGOTIATING' && lead.status !== 'CLOSING') {
      throw new BadRequestException(
        'Lead must be in NEGOTIATING or CLOSING status to close a deal',
      );
    }

    // Update lead status to CLOSED
    await this.prisma.lead.update({
      where: { id },
      data: { status: 'CLOSED' },
    });

    // Create transaction (which also creates commission and updates property)
    return this.transactionsService.create({
      leadId: id,
      type: data.type,
      dealValue: data.dealValue,
    });
  }
}
