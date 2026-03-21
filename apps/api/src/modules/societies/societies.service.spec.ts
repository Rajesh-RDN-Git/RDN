import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { SocietiesService } from './societies.service';
import { PrismaService } from '../../database/prisma.service';

describe('SocietiesService', () => {
  let service: SocietiesService;

  const mockPrisma = {
    society: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SocietiesService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<SocietiesService>(SocietiesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated societies', async () => {
      mockPrisma.society.findMany.mockResolvedValue([{ id: 's-1' }]);
      mockPrisma.society.count.mockResolvedValue(1);

      const result = await service.findAll({} as any);
      expect(result).toEqual({ data: [{ id: 's-1' }], total: 1, page: 1, limit: 20 });
    });

    it('should apply city filter case-insensitively', async () => {
      mockPrisma.society.findMany.mockResolvedValue([]);
      mockPrisma.society.count.mockResolvedValue(0);

      await service.findAll({ city: 'Mumbai' } as any);
      expect(mockPrisma.society.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            city: { contains: 'Mumbai', mode: 'insensitive' },
          }),
        }),
      );
    });
  });

  describe('findBySlug', () => {
    it('should return society', async () => {
      mockPrisma.society.findUnique.mockResolvedValue({ id: 's-1', slug: 'green-valley' });
      expect(await service.findBySlug('green-valley')).toEqual({ id: 's-1', slug: 'green-valley' });
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.society.findUnique.mockResolvedValue(null);
      await expect(service.findBySlug('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create society with unique slug', async () => {
      mockPrisma.society.findUnique.mockResolvedValue(null);
      mockPrisma.society.create.mockResolvedValue({ id: 's-1', slug: 'new-society' });

      const result = await service.create({
        name: 'New Society',
        slug: 'new-society',
        address: '123 St',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        totalUnits: 100,
      } as any);
      expect(result.slug).toBe('new-society');
    });

    it('should throw ConflictException for duplicate slug', async () => {
      mockPrisma.society.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(service.create({ slug: 'existing-slug' } as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should update society', async () => {
      mockPrisma.society.findUnique.mockResolvedValue({ id: 's-1' });
      mockPrisma.society.update.mockResolvedValue({ id: 's-1', name: 'Updated' });

      const result = await service.update('s-1', { name: 'Updated' } as any);
      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.society.findUnique.mockResolvedValue(null);
      await expect(service.update('x', {} as any)).rejects.toThrow(NotFoundException);
    });
  });
});
