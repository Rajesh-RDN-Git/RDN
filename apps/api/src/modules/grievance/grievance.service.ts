import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { CreateGrievanceDto } from './dto/create-grievance.dto';
import type { UpdateGrievanceDto } from './dto/update-grievance.dto';
import type { QueryGrievancesDto } from './dto/query-grievances.dto';
import type { Prisma } from '@rdn/db';

@Injectable()
export class GrievanceService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryGrievancesDto, userId: string, userRole: string): Promise<any> {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    const where: Prisma.GrievanceWhereInput = {};
    if (query.status) where.status = query.status as any;
    if (query.severity) where.severity = query.severity as any;
    if (query.category) where.category = query.category as any;
    if (query.societyId) where.societyId = query.societyId;

    // Non-admins only see their own grievances
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'RWA_ADMIN') {
      where.filedBy = userId;
    }

    const [data, total] = await Promise.all([
      this.prisma.grievance.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
        include: {
          filer: { select: { id: true, name: true } },
          againstUser: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } },
          society: { select: { id: true, name: true } },
        },
      }),
      this.prisma.grievance.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<any> {
    const grievance = await this.prisma.grievance.findUnique({
      where: { id },
      include: {
        filer: { select: { id: true, name: true } },
        againstUser: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
        society: { select: { id: true, name: true } },
        transaction: { select: { id: true, type: true, dealValue: true } },
      },
    });

    if (!grievance) throw new NotFoundException('Grievance not found');
    return grievance;
  }

  async create(data: CreateGrievanceDto, userId: string): Promise<any> {
    // Calculate SLA deadline based on severity
    const slaHours: Record<string, number> = {
      CRITICAL: 4,
      HIGH: 24,
      MEDIUM: 72,
      LOW: 168, // 7 days
    };
    const hours = slaHours[data.severity] || 72;
    const slaDeadline = new Date(Date.now() + hours * 60 * 60 * 1000);

    return this.prisma.grievance.create({
      data: {
        filedBy: userId,
        category: data.category as any,
        severity: data.severity as any,
        description: data.description,
        againstUserId: data.againstUserId,
        societyId: data.societyId,
        transactionId: data.transactionId,
        evidenceUrls: (data.evidenceUrls || []) as any,
        slaDeadline,
      },
      include: {
        filer: { select: { id: true, name: true } },
      },
    });
  }

  async update(id: string, data: UpdateGrievanceDto): Promise<any> {
    const grievance = await this.prisma.grievance.findUnique({ where: { id } });
    if (!grievance) throw new NotFoundException('Grievance not found');

    const updateData: any = {};
    if (data.status) {
      updateData.status = data.status;
      if (data.status === 'RESOLVED' || data.status === 'CLOSED') {
        updateData.resolvedAt = new Date();
      }
    }
    if (data.resolutionNotes) updateData.resolutionNotes = data.resolutionNotes;
    if (data.assignedTo) updateData.assignedTo = data.assignedTo;

    return this.prisma.grievance.update({
      where: { id },
      data: updateData,
    });
  }

  async escalate(id: string): Promise<any> {
    const grievance = await this.prisma.grievance.findUnique({ where: { id } });
    if (!grievance) throw new NotFoundException('Grievance not found');
    if (grievance.status === 'RESOLVED' || grievance.status === 'CLOSED') {
      throw new BadRequestException('Cannot escalate a resolved/closed grievance');
    }

    return this.prisma.grievance.update({
      where: { id },
      data: {
        status: 'ESCALATED',
        escalationLevel: { increment: 1 },
      },
    });
  }
}
