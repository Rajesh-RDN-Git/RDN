import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { QueryLeadsDto } from './dto/query-leads.dto';
import type { CreateLeadDto } from './dto/create-lead.dto';
import type { CreateManualLeadDto } from './dto/create-manual-lead.dto';
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

    // Phone numbers are masked everywhere by default. The platform owner
    // (SUPER_ADMIN) is the sole exception — they see the raw buyer/contact phone
    // for manual follow-up. Every other role keeps the masked-call flow.
    const isSuperAdmin = userRole === 'SUPER_ADMIN';
    const buyerSelect = isSuperAdmin
      ? { id: true, name: true, phone: true }
      : { id: true, name: true };

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
          buyer: { select: buyerSelect },
          dealer: {
            select: { id: true, user: { select: { id: true, name: true } } },
          },
          society: { select: { id: true, name: true } },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    // contactPhone is a scalar on the lead; redact it for non-super-admins.
    const rows = isSuperAdmin
      ? data
      : data.map((l) => ({ ...l, contactPhone: l.contactPhone ? '••••••' : null }));

    return { data: rows, total, page, limit };
  }

  // A lead may only be seen/acted on by SUPER_ADMIN, its buyer, the assigned
  // dealer, the property owner, or the RWA admin of its society. `caller`
  // undefined = internal call (no scoping). Throws if the caller is none of these.
  private assertLeadAccess(
    lead: {
      buyerId?: string | null;
      dealer?: { userId?: string | null } | null;
      property?: { ownerId?: string | null } | null;
      society?: { rwaAdminId?: string | null } | null;
    },
    caller?: { id: string; role: string },
  ): void {
    if (!caller || caller.role === 'SUPER_ADMIN') return;
    const allowed =
      lead.buyerId === caller.id ||
      lead.dealer?.userId === caller.id ||
      lead.property?.ownerId === caller.id ||
      lead.society?.rwaAdminId === caller.id;
    if (!allowed) {
      throw new ForbiddenException('You do not have access to this lead');
    }
  }

  async findOne(id: string, caller?: { id: string; role: string }) {
    const isSuperAdmin = caller?.role === 'SUPER_ADMIN';
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        property: {
          include: {
            society: { select: { id: true, name: true, slug: true } },
            media: { take: 3, orderBy: { order: 'asc' } },
          },
        },
        buyer: {
          select: isSuperAdmin ? { id: true, name: true, phone: true } : { id: true, name: true },
        },
        dealer: {
          select: { id: true, userId: true, user: { select: { id: true, name: true } } },
        },
        society: { select: { id: true, name: true, rwaAdminId: true } },
      },
    });

    if (!lead) throw new NotFoundException('Lead not found');
    this.assertLeadAccess(lead, caller);
    if (!isSuperAdmin && lead.contactPhone) {
      return { ...lead, contactPhone: '••••••' };
    }
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

    // Idempotency: if this buyer already has an open lead on this property, return it
    // instead of inserting a duplicate. Guards double-submits (multiple CTAs) and the
    // client's 401-refresh retry re-sending the POST. Terminal leads (CLOSED/LOST) don't
    // block a fresh enquiry later.
    const existing = await this.prisma.lead.findFirst({
      where: {
        buyerId,
        propertyId: data.propertyId,
        status: { notIn: ['CLOSED', 'LOST'] },
      },
      include: {
        property: { select: { id: true, flatNumber: true, towerBlock: true } },
        dealer: { select: { id: true, user: { select: { id: true, name: true } } } },
      },
    });
    if (existing) return existing;

    // Find an active dealer for this society. If none exists yet, the lead is
    // queued unassigned (dealerId = null) and gets claimed when a dealer becomes
    // active in the society (see DealersService.claimUnassignedLeads).
    let dealerId: string | null = null;
    if (property.assignedDealerId && property.assignedDealer?.isActive) {
      dealerId = property.assignedDealerId;
    } else {
      // No explicitly-assigned dealer, or the assigned one is inactive — route to the
      // first active dealer in the society (else leave unassigned for later claim).
      const dealer = await this.prisma.dealer.findFirst({
        where: { societyId: property.societyId, isActive: true },
      });
      dealerId = dealer?.id ?? null;
    }

    // Allocate a human-readable reference id (R-#### for rent-intent, B-#### for
    // buy/sale). The counter upsert takes a row-level lock so concurrent creates
    // get distinct sequential numbers; the lead insert shares the transaction so a
    // failed insert never burns a number out from under a committed one.
    const prefix = property.transactionType === 'RENT' ? 'R' : 'B';
    const lead = await this.prisma.$transaction(async (tx) => {
      const counter = await tx.counter.upsert({
        where: { key: `lead_${prefix}` },
        create: { key: `lead_${prefix}`, value: 1 },
        update: { value: { increment: 1 } },
      });
      const refId = `${prefix}-${String(counter.value).padStart(4, '0')}`;
      return tx.lead.create({
        data: {
          refId,
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
    });

    // Notify dealer about new lead
    if (lead.dealer?.user?.id) {
      this.notificationsService
        .create({
          userId: lead.dealer.user.id,
          type: 'LEAD',
          title: 'New Lead Assigned',
          body: `New enquiry for ${property.flatNumber}, ${property.towerBlock}`,
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
        body: `Someone is interested in your property at ${property.flatNumber}, ${property.towerBlock}`,
        channel: 'IN_APP',
        data: { leadId: lead.id, propertyId: data.propertyId },
      })
      .catch(() => {});

    return lead;
  }

  // Super-admin adds a lead by hand (e.g. a call-back prospect rung the helpline).
  // Buyer/property are optional; the contact is stored free-form on the lead.
  async createManual(data: CreateManualLeadDto) {
    let societyId = data.societyId ?? null;
    let dealerId = data.dealerId ?? null;
    let prefix = 'B';

    if (data.propertyId) {
      const property = await this.prisma.property.findUnique({
        where: { id: data.propertyId },
      });
      if (!property) throw new NotFoundException('Property not found');
      societyId = societyId ?? property.societyId;
      prefix = property.transactionType === 'RENT' ? 'R' : 'B';
      if (!dealerId) dealerId = property.assignedDealerId ?? null;
    }

    if (dealerId) {
      const dealer = await this.prisma.dealer.findUnique({ where: { id: dealerId } });
      if (!dealer) throw new NotFoundException('Dealer not found');
    }

    const notes = data.note ? [{ at: new Date().toISOString(), text: data.note }] : [];

    const lead = await this.prisma.$transaction(async (tx) => {
      const counter = await tx.counter.upsert({
        where: { key: `lead_${prefix}` },
        create: { key: `lead_${prefix}`, value: 1 },
        update: { value: { increment: 1 } },
      });
      const refId = `${prefix}-${String(counter.value).padStart(4, '0')}`;
      return tx.lead.create({
        data: {
          refId,
          propertyId: data.propertyId ?? null,
          buyerId: null,
          dealerId,
          societyId,
          contactName: data.contactName,
          contactPhone: data.contactPhone,
          source: (data.source as any) ?? 'MANUAL',
          notes: notes as any,
        },
        include: {
          property: { select: { id: true, flatNumber: true, towerBlock: true } },
          dealer: { select: { id: true, user: { select: { id: true, name: true } } } },
        },
      });
    });

    if (lead.dealer?.user?.id) {
      this.notificationsService
        .create({
          userId: lead.dealer.user.id,
          type: 'LEAD',
          title: 'New Lead Assigned',
          body: `A lead was assigned to you by the admin (${data.contactName})`,
          channel: 'IN_APP',
          data: { leadId: lead.id },
        })
        .catch(() => {});
    }

    return lead;
  }

  // Super-admin forwards/assigns an existing lead to a chosen dealer.
  async assign(id: string, dealerId: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');

    const dealer = await this.prisma.dealer.findUnique({
      where: { id: dealerId },
      include: { user: { select: { id: true, name: true } } },
    });
    if (!dealer) throw new NotFoundException('Dealer not found');

    const updated = await this.prisma.lead.update({
      where: { id },
      data: { dealerId, autoReassigned: false },
      include: {
        property: { select: { id: true, flatNumber: true, towerBlock: true } },
        dealer: { select: { id: true, user: { select: { id: true, name: true } } } },
        buyer: { select: { id: true, name: true } },
        society: { select: { id: true, name: true } },
      },
    });

    if (dealer.user?.id) {
      this.notificationsService
        .create({
          userId: dealer.user.id,
          type: 'LEAD',
          title: 'Lead Assigned to You',
          body: updated.property
            ? `You were assigned a lead for ${updated.property.flatNumber}, ${updated.property.towerBlock}`
            : 'You were assigned a new lead by the admin',
          channel: 'IN_APP',
          data: { leadId: updated.id },
        })
        .catch(() => {});
    }

    return updated;
  }

  async update(id: string, data: UpdateLeadDto, caller?: { id: string; role: string }) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        dealer: { select: { userId: true } },
        society: { select: { rwaAdminId: true } },
      },
    });
    if (!lead) throw new NotFoundException('Lead not found');
    this.assertLeadAccess(lead, caller);

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
    if (!lead.property) throw new BadRequestException('Lead has no linked property');
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

  async closeDeal(id: string, data: CloseDealDto, caller?: { id: string; role: string }) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        dealer: { select: { userId: true } },
        society: { select: { rwaAdminId: true } },
      },
    });
    if (!lead) throw new NotFoundException('Lead not found');
    this.assertLeadAccess(lead, caller);

    if (
      lead.status !== 'NEGOTIATING' &&
      lead.status !== 'MEETING_ARRANGED' &&
      lead.status !== 'DEAL_OPEN' &&
      lead.status !== 'CLOSING'
    ) {
      throw new BadRequestException(
        'Lead must be in negotiation, meeting-arranged, or deal-open status to close a deal',
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
