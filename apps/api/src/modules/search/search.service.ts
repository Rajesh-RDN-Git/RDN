import { Injectable } from '@nestjs/common';
import type { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async searchProperties(query: any) {
    // TODO: Full-text search with filters (city, area, price range, BHK, type)
    return { data: [], total: 0, filters: query };
  }
}
