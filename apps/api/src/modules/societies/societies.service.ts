import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { QuerySocietiesDto } from './dto/query-societies.dto';
import type { CreateSocietyDto } from './dto/create-society.dto';
import type { UpdateSocietyDto } from './dto/update-society.dto';
import type { Prisma } from '@rdn/db';

@Injectable()
export class SocietiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QuerySocietiesDto) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    const where: Prisma.SocietyWhereInput = {};
    if (query.city) where.city = { contains: query.city, mode: 'insensitive' };
    if (query.state) where.state = { contains: query.state, mode: 'insensitive' };
    if (query.pincode) where.pincode = query.pincode;

    const [data, total] = await Promise.all([
      this.prisma.society.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          address: true,
          city: true,
          state: true,
          pincode: true,
          totalUnits: true,
          amenities: true,
          status: true,
          verificationStatus: true,
          createdAt: true,
        },
      }),
      this.prisma.society.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findBySlug(slug: string) {
    const society = await this.prisma.society.findUnique({
      where: { slug },
      include: {
        _count: { select: { properties: true, dealers: true } },
      },
    });

    if (!society) throw new NotFoundException('Society not found');
    return society;
  }

  async create(data: CreateSocietyDto) {
    // Validate slug uniqueness
    const existing = await this.prisma.society.findUnique({
      where: { slug: data.slug },
    });
    if (existing) {
      throw new ConflictException('A society with this slug already exists');
    }

    return this.prisma.society.create({
      data: {
        name: data.name,
        slug: data.slug,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        lat: data.lat,
        lng: data.lng,
        totalUnits: data.totalUnits,
        amenities: data.amenities || [],
      },
    });
  }

  async update(id: string, data: UpdateSocietyDto) {
    const society = await this.prisma.society.findUnique({ where: { id } });
    if (!society) throw new NotFoundException('Society not found');

    const updateData: Prisma.SocietyUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.pincode !== undefined) updateData.pincode = data.pincode;
    if (data.lat !== undefined) updateData.lat = data.lat;
    if (data.lng !== undefined) updateData.lng = data.lng;
    if (data.totalUnits !== undefined) updateData.totalUnits = data.totalUnits;
    if (data.amenities !== undefined) updateData.amenities = data.amenities;
    if (data.status !== undefined)
      updateData.status = data.status as Prisma.EnumSocietyStatusFieldUpdateOperationsInput['set'];

    return this.prisma.society.update({
      where: { id },
      data: updateData,
    });
  }
}
