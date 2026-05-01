import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { SearchPropertiesDto } from './dto/search-properties.dto';
import type { Prisma } from '@rdn/db';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async searchProperties(query: SearchPropertiesDto) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    const where: Prisma.PropertyWhereInput = {
      status: 'ACTIVE',
      // Only surface listings that have at least RWA approval. Final SUPER_ADMIN
      // verification (VERIFIED) is required only for the "Verified" filter chip.
      verificationStatus: { in: ['RWA_APPROVED', 'VERIFIED'] },
    };

    // Filter by city (through society relation)
    if (query.city) {
      where.society = { city: { equals: query.city, mode: 'insensitive' } };
    }

    if (query.societyId) where.societyId = query.societyId;
    if (query.type) where.type = query.type as any;
    if (query.transactionType) where.transactionType = query.transactionType as any;
    if (query.bhk) where.bhk = Number(query.bhk);
    if (query.furnishing) where.furnishing = query.furnishing as any;
    if (query.availabilityStatus) where.availabilityStatus = query.availabilityStatus as any;

    // Price range filters
    if (query.priceMin || query.priceMax) {
      const priceFilter: Prisma.DecimalNullableFilter = {};
      if (query.priceMin) priceFilter.gte = query.priceMin;
      if (query.priceMax) priceFilter.lte = query.priceMax;

      // Apply to the appropriate price field based on transaction type
      if (query.transactionType === 'SALE') {
        where.priceSale = priceFilter;
      } else {
        // Default to rent price for RENT, BOTH, or unspecified
        where.priceRent = priceFilter;
      }
    }

    // Build sort
    const sortBy = query.sortBy || 'created_at';
    const sortOrder = (query.sortOrder || 'desc') as 'asc' | 'desc';
    const orderByMap: Record<string, Prisma.PropertyOrderByWithRelationInput> = {
      price_rent: { priceRent: sortOrder },
      price_sale: { priceSale: sortOrder },
      created_at: { createdAt: sortOrder },
    };
    const orderBy = orderByMap[sortBy] || { createdAt: 'desc' };

    const [data, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          society: { select: { id: true, name: true, slug: true, city: true } },
          media: { take: 1, orderBy: { order: 'asc' }, select: { url: true, type: true } },
          _count: { select: { leads: true } },
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}
