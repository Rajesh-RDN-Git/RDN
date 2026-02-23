import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { QueryAdminUsersDto } from './dto/query-admin-users.dto';
import type { OnboardSocietyDto } from './dto/onboard-society.dto';
import type { Prisma } from '@rdn/db';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<any> {
    const [
      totalUsers,
      totalSocieties,
      totalProperties,
      totalDealers,
      totalLeads,
      pendingSocieties,
      pendingProperties,
      openGrievances,
      activeSocieties,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.society.count(),
      this.prisma.property.count({ where: { status: 'ACTIVE' } }),
      this.prisma.dealer.count({ where: { isActive: true } }),
      this.prisma.lead.count(),
      this.prisma.society.count({ where: { verificationStatus: 'PENDING' } }),
      this.prisma.property.count({ where: { verificationStatus: 'PENDING' } }),
      this.prisma.grievance.count({
        where: { status: { in: ['OPEN', 'IN_PROGRESS', 'ESCALATED'] } },
      }),
      this.prisma.society.count({ where: { status: 'ONBOARDED' } }),
    ]);

    const pendingVerifications = pendingSocieties + pendingProperties;

    return {
      totalUsers,
      totalSocieties,
      activeSocieties,
      totalProperties,
      totalDealers,
      totalLeads,
      pendingVerifications,
      openGrievances,
    };
  }

  async getUsers(query: QueryAdminUsersDto): Promise<any> {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};
    if (query.role) where.role = query.role as any;
    if (query.status) where.status = query.status as any;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          // Never expose phone in admin list
          _count: {
            select: {
              ownedProperties: true,
              buyerLeads: true,
              filedGrievances: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async onboardSociety(data: OnboardSocietyDto): Promise<any> {
    // Check slug uniqueness
    const existing = await this.prisma.society.findUnique({ where: { slug: data.slug } });
    if (existing) throw new ConflictException(`Society with slug "${data.slug}" already exists`);

    // If rwaAdminId provided, verify user exists and update their role
    if (data.rwaAdminId) {
      const user = await this.prisma.user.findUnique({ where: { id: data.rwaAdminId } });
      if (user && user.role !== 'RWA_ADMIN' && user.role !== 'SUPER_ADMIN') {
        await this.prisma.user.update({
          where: { id: data.rwaAdminId },
          data: { role: 'RWA_ADMIN' },
        });
      }
    }

    return this.prisma.society.create({
      data: {
        name: data.name,
        slug: data.slug,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        totalUnits: data.totalUnits,
        amenities: (data.amenities || []) as any,
        rwaAdminId: data.rwaAdminId,
        mandateStartDate: data.mandateStartDate ? new Date(data.mandateStartDate) : undefined,
        mandateEndDate: data.mandateEndDate ? new Date(data.mandateEndDate) : undefined,
        status: 'ONBOARDED',
        verificationStatus: 'VERIFIED',
      },
    });
  }
}
