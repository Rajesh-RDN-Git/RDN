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

    // Free-text search across society name/city/address (address holds locality,
    // sector and road — e.g. "Golf Course Road, Sector 42"), flat and tower/block.
    // Tokenize: every word must appear in some field, so a multi-word query like
    // "Sector 42 DLF" matches even when the words aren't a contiguous substring.
    if (query.q) {
      const words = String(query.q).trim().split(/\s+/).filter(Boolean);
      if (words.length) {
        const wordClauses = words.map((w) => ({
          OR: [
            { society: { name: { contains: w, mode: 'insensitive' as const } } },
            { society: { city: { contains: w, mode: 'insensitive' as const } } },
            { society: { address: { contains: w, mode: 'insensitive' as const } } },
            { flatNumber: { contains: w, mode: 'insensitive' as const } },
            { towerBlock: { contains: w, mode: 'insensitive' as const } },
          ],
        }));
        where.AND = [...((where.AND as any[]) ?? []), ...wordClauses];
      }
    }

    if (query.societyId) where.societyId = query.societyId;
    if (query.type) where.type = query.type as any;
    if (query.transactionType) {
      // A property listed as BOTH is available for sale AND rent, so it must surface
      // under both the Buy (SALE) and Rent (RENT) views — an exact match dropped it
      // from both, which split/lost the per-tab counts.
      if (query.transactionType === 'SALE') where.transactionType = { in: ['SALE', 'BOTH'] };
      else if (query.transactionType === 'RENT') where.transactionType = { in: ['RENT', 'BOTH'] };
      else where.transactionType = query.transactionType as any;
    }
    if (query.bhk) {
      // Accept a single value (`3`) or a comma-separated multi-select (`2,3,4`).
      const bhks = String(query.bhk)
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => !Number.isNaN(n));
      if (bhks.length === 1) where.bhk = bhks[0];
      else if (bhks.length > 1) where.bhk = { in: bhks };
    }
    if (query.furnishing) where.furnishing = query.furnishing as any;
    if (query.availabilityStatus) where.availabilityStatus = query.availabilityStatus as any;

    // Area range filters
    if (query.areaMin || query.areaMax) {
      const areaFilter: Prisma.DecimalNullableFilter = {};
      if (query.areaMin) areaFilter.gte = query.areaMin;
      if (query.areaMax) areaFilter.lte = query.areaMax;
      where.carpetArea = areaFilter;
    }

    // Amenities filter — stored as JSON array; use string_contains per value
    if (query.amenities) {
      const labels = String(query.amenities)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (labels.length) {
        const amenityClauses = labels.map((label) => ({
          amenities: { string_contains: label },
        }));
        where.AND = [...((where.AND as any[]) ?? []), ...amenityClauses];
      }
    }

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
