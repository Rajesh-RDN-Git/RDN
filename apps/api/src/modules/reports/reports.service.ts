import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { QueryReportDto } from './dto/query-report.dto';
import type { Prisma } from '@rdn/db';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(query: QueryReportDto): Promise<any> {
    const dateFilter = this.buildDateFilter(query.from, query.to);
    const societyFilter = query.societyId ? { societyId: query.societyId } : {};

    const [totalProperties, totalLeads, totalDealers, totalSocieties, activeLeads, closedLeads] =
      await Promise.all([
        this.prisma.property.count({ where: { status: 'ACTIVE', ...societyFilter } }),
        this.prisma.lead.count({ where: { ...societyFilter, createdAt: dateFilter } }),
        this.prisma.dealer.count({ where: { isActive: true, ...societyFilter } }),
        this.prisma.society.count({ where: { status: 'ONBOARDED' } }),
        this.prisma.lead.count({
          where: {
            ...societyFilter,
            status: { notIn: ['CLOSED', 'LOST'] },
            createdAt: dateFilter,
          },
        }),
        this.prisma.lead.count({
          where: { ...societyFilter, status: 'CLOSED', createdAt: dateFilter },
        }),
      ]);

    const conversionRate = totalLeads > 0 ? ((closedLeads / totalLeads) * 100).toFixed(1) : '0.0';

    return {
      totalProperties,
      totalLeads,
      totalDealers,
      totalSocieties,
      activeLeads,
      closedLeads,
      conversionRate: `${conversionRate}%`,
    };
  }

  async getTransactions(query: QueryReportDto): Promise<any> {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    const where: Prisma.TransactionWhereInput = {};
    if (query.from || query.to) {
      where.closedAt = this.buildDateFilter(query.from, query.to);
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
              dealer: { select: { id: true, user: { select: { name: true } } } },
            },
          },
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    // Aggregate totals
    const aggregates = await this.prisma.transaction.aggregate({
      where,
      _sum: { dealValue: true, buyerCommission: true, sellerCommission: true },
      _count: true,
    });

    return {
      data,
      total,
      page,
      limit,
      summary: {
        totalDealValue: aggregates._sum.dealValue,
        totalBuyerCommission: aggregates._sum.buyerCommission,
        totalSellerCommission: aggregates._sum.sellerCommission,
        count: aggregates._count,
      },
    };
  }

  async getCommissions(query: QueryReportDto): Promise<any> {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    const where: Prisma.CommissionWhereInput = {};
    if (query.from || query.to) {
      where.createdAt = this.buildDateFilter(query.from, query.to);
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
          transaction: { select: { id: true, type: true, dealValue: true } },
        },
      }),
      this.prisma.commission.count({ where }),
    ]);

    const aggregates = await this.prisma.commission.aggregate({
      where,
      _sum: { amount: true, gst: true },
      _count: true,
    });

    return {
      data,
      total,
      page,
      limit,
      summary: {
        totalAmount: aggregates._sum.amount,
        totalGst: aggregates._sum.gst,
        count: aggregates._count,
      },
    };
  }

  async getLeads(query: QueryReportDto): Promise<any> {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    const where: Prisma.LeadWhereInput = {};
    if (query.societyId) where.societyId = query.societyId;
    if (query.from || query.to) {
      where.createdAt = this.buildDateFilter(query.from, query.to);
    }

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          property: { select: { id: true, flatNumber: true, towerBlock: true } },
          buyer: { select: { id: true, name: true } },
          dealer: { select: { id: true, user: { select: { name: true } } } },
          society: { select: { id: true, name: true } },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    // Status breakdown
    const statusBreakdown = await this.prisma.lead.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    // Source breakdown
    const sourceBreakdown = await this.prisma.lead.groupBy({
      by: ['source'],
      where,
      _count: true,
    });

    return {
      data,
      total,
      page,
      limit,
      breakdown: {
        byStatus: statusBreakdown.map((s) => ({ status: s.status, count: s._count })),
        bySource: sourceBreakdown.map((s) => ({ source: s.source, count: s._count })),
      },
    };
  }

  private buildDateFilter(from?: string, to?: string) {
    if (!from && !to) return undefined;
    const filter: any = {};
    if (from) filter.gte = new Date(from);
    if (to) filter.lte = new Date(to);
    return filter;
  }
}
