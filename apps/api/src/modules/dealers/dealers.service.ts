import { Injectable } from '@nestjs/common';
import type { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DealersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    // TODO: Implement pagination, filtering by status/area
    return { data: [], total: 0 };
  }

  async findOne(id: string) {
    // TODO: Find dealer by ID with profile, stats, leads
    return { id };
  }

  async apply(data: any) {
    // TODO: Submit dealer application with documents
    return { id: 'TODO', status: 'pending', ...data };
  }

  async approve(id: string) {
    // TODO: Approve dealer and update status
    return { id, status: 'approved' };
  }

  async reject(id: string) {
    // TODO: Reject dealer application with reason
    return { id, status: 'rejected' };
  }
}
