import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { QueryPropertiesDto } from './dto/query-properties.dto';
import type { CreatePropertyDto } from './dto/create-property.dto';
import type { UpdatePropertyDto } from './dto/update-property.dto';
import type { Prisma } from '@rdn/db';

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryPropertiesDto) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    const where: Prisma.PropertyWhereInput = {};
    if (query.societyId) where.societyId = query.societyId;
    if (query.ownerId) where.ownerId = query.ownerId;
    // Dealer "Assigned Properties" view: resolve the dealer record from the
    // user id, then filter to properties assigned to that dealer. Use a
    // non-matching sentinel when the user isn't a dealer so nothing leaks.
    if (query.assignedDealerUserId) {
      const dealer = await this.prisma.dealer.findFirst({
        where: { userId: query.assignedDealerUserId },
        select: { id: true },
      });
      // assignedDealerId is a UUID column — a non-UUID sentinel ('__no_dealer__')
      // crashes the query with "invalid input syntax for type uuid" (500). Use a
      // valid all-zero UUID that matches no real dealer so the result is empty.
      where.assignedDealerId = dealer?.id ?? '00000000-0000-0000-0000-000000000000';
    }
    // RWA "Properties" view: scope to the societies this admin manages.
    if (query.rwaAdminUserId) {
      const societies = await this.prisma.society.findMany({
        where: { rwaAdminId: query.rwaAdminUserId },
        select: { id: true },
      });
      where.societyId = { in: societies.map((s) => s.id) };
    }
    if (query.type) where.type = query.type as any;
    if (query.transactionType) where.transactionType = query.transactionType as any;
    if (query.bhk) where.bhk = Number(query.bhk);
    if (query.furnishing) where.furnishing = query.furnishing as any;
    if (query.availabilityStatus) where.availabilityStatus = query.availabilityStatus as any;
    if (query.status) where.status = query.status as any;
    // Default to ACTIVE only for the public catalogue. Management views (owner,
    // assigned dealer, RWA admin) show all statuses.
    else if (!query.ownerId && !query.assignedDealerUserId && !query.rwaAdminUserId)
      where.status = 'ACTIVE';

    if (query.priceMin || query.priceMax) {
      if (query.transactionType === 'SALE') {
        where.priceSale = {};
        if (query.priceMin) where.priceSale.gte = query.priceMin;
        if (query.priceMax) where.priceSale.lte = query.priceMax;
      } else {
        where.priceRent = {};
        if (query.priceMin) where.priceRent.gte = query.priceMin;
        if (query.priceMax) where.priceRent.lte = query.priceMax;
      }
    }

    const sortField =
      query.sortBy === 'price_rent'
        ? 'priceRent'
        : query.sortBy === 'price_sale'
          ? 'priceSale'
          : 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const [data, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortField]: sortOrder },
        include: {
          society: { select: { id: true, name: true, slug: true, city: true } },
          media: { orderBy: { order: 'asc' }, take: 5 },
          _count: { select: { leads: true } },
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        society: {
          select: { id: true, name: true, slug: true, city: true, state: true, pincode: true },
        },
        owner: { select: { id: true, name: true } },
        assignedDealer: {
          select: { id: true, user: { select: { id: true, name: true } } },
        },
        media: { orderBy: { order: 'asc' } },
        _count: { select: { leads: true } },
      },
    });

    if (!property) throw new NotFoundException('Property not found');

    // Increment views count
    await this.prisma.property.update({
      where: { id },
      data: { viewsCount: { increment: 1 } },
    });

    return property;
  }

  async create(data: CreatePropertyDto, ownerId: string) {
    // Verify society exists
    const society = await this.prisma.society.findUnique({
      where: { id: data.societyId },
    });
    if (!society) throw new NotFoundException('Society not found');

    return this.prisma.property.create({
      data: {
        societyId: data.societyId,
        ownerId,
        flatNumber: data.flatNumber,
        towerBlock: data.towerBlock,
        type: data.type as any,
        transactionType: data.transactionType as any,
        bhk: data.bhk,
        carpetArea: data.carpetArea,
        superArea: data.superArea,
        floor: data.floor,
        totalFloors: data.totalFloors,
        facing: data.facing,
        furnishing: data.furnishing as any,
        priceRent: data.priceRent,
        priceSale: data.priceSale,
        securityDeposit: data.securityDeposit,
        availableFrom: data.availableFrom ? new Date(data.availableFrom) : undefined,
        restrictions: (data.restrictions || {}) as any,
        amenities: (data.amenities || {}) as any,
      },
      include: {
        society: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async update(id: string, data: UpdatePropertyDto, userId: string, userRole: string) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException('Property not found');

    // Owners can edit their own, SUPER_ADMIN can edit any, RWA_ADMIN within society
    if (userRole === 'OWNER' && property.ownerId !== userId) {
      throw new ForbiddenException('You can only update your own properties');
    }

    const updateData: any = {};
    if (data.flatNumber !== undefined) updateData.flatNumber = data.flatNumber;
    if (data.towerBlock !== undefined) updateData.towerBlock = data.towerBlock;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.transactionType !== undefined) updateData.transactionType = data.transactionType;
    if (data.bhk !== undefined) updateData.bhk = data.bhk;
    if (data.carpetArea !== undefined) updateData.carpetArea = data.carpetArea;
    if (data.superArea !== undefined) updateData.superArea = data.superArea;
    if (data.floor !== undefined) updateData.floor = data.floor;
    if (data.totalFloors !== undefined) updateData.totalFloors = data.totalFloors;
    if (data.facing !== undefined) updateData.facing = data.facing;
    if (data.furnishing !== undefined) updateData.furnishing = data.furnishing;
    if (data.priceRent !== undefined) updateData.priceRent = data.priceRent;
    if (data.priceSale !== undefined) updateData.priceSale = data.priceSale;
    if (data.securityDeposit !== undefined) updateData.securityDeposit = data.securityDeposit;
    if (data.availableFrom !== undefined) updateData.availableFrom = new Date(data.availableFrom);
    if (data.availabilityStatus !== undefined)
      updateData.availabilityStatus = data.availabilityStatus;
    if (data.restrictions !== undefined) updateData.restrictions = data.restrictions;
    if (data.amenities !== undefined) updateData.amenities = data.amenities;
    if (data.status !== undefined) updateData.status = data.status;

    return this.prisma.property.update({
      where: { id },
      data: updateData,
    });
  }

  async getVerificationQueue(userId: string, role: string) {
    // SUPER_ADMIN: all PENDING. RWA_ADMIN: PENDING within own societies.
    const where: Prisma.PropertyWhereInput = { verificationStatus: 'PENDING' };
    if (role === 'RWA_ADMIN') {
      const societies = await this.prisma.society.findMany({
        where: { rwaAdminId: userId },
        select: { id: true },
      });
      where.societyId = { in: societies.map((s) => s.id) };
    } else if (role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Insufficient permissions');
    }
    return this.prisma.property.findMany({
      where,
      include: { society: { select: { id: true, name: true, slug: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateVerification(
    id: string,
    decision: 'RWA_APPROVED' | 'REJECTED',
    reason: string | undefined,
    userId: string,
    role: string,
  ) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: { society: { select: { rwaAdminId: true } } },
    });
    if (!property) throw new NotFoundException('Property not found');

    if (role === 'RWA_ADMIN' && property.society.rwaAdminId !== userId) {
      throw new ForbiddenException('Not your society');
    }

    return this.prisma.property.update({
      where: { id },
      data: {
        verificationStatus: decision,
        // Track reason in restrictions JSON if rejected
        ...(decision === 'REJECTED' && reason
          ? {
              restrictions: {
                ...((property.restrictions as object) || {}),
                rejectionReason: reason,
              },
            }
          : {}),
      },
    });
  }

  async delist(id: string, userId: string, userRole: string) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException('Property not found');

    if (userRole === 'OWNER' && property.ownerId !== userId) {
      throw new ForbiddenException('You can only delist your own properties');
    }

    return this.prisma.property.update({
      where: { id },
      data: { status: 'DELISTED' },
    });
  }
}
