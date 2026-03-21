import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '../../database/prisma.service';

describe('SearchService', () => {
  let service: SearchService;

  const mockPrisma = {
    property: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SearchService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<SearchService>(SearchService);
    jest.clearAllMocks();
  });

  describe('searchProperties', () => {
    it('should only return ACTIVE properties', async () => {
      mockPrisma.property.findMany.mockResolvedValue([]);
      mockPrisma.property.count.mockResolvedValue(0);

      await service.searchProperties({} as any);

      expect(mockPrisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'ACTIVE' }),
        }),
      );
    });

    it('should filter by city through society', async () => {
      mockPrisma.property.findMany.mockResolvedValue([]);
      mockPrisma.property.count.mockResolvedValue(0);

      await service.searchProperties({ city: 'Gurgaon' } as any);

      expect(mockPrisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            society: { city: { equals: 'Gurgaon', mode: 'insensitive' } },
          }),
        }),
      );
    });

    it('should apply SALE price filter to priceSale field', async () => {
      mockPrisma.property.findMany.mockResolvedValue([]);
      mockPrisma.property.count.mockResolvedValue(0);

      await service.searchProperties({
        transactionType: 'SALE',
        priceMin: 5000000,
        priceMax: 10000000,
      } as any);

      expect(mockPrisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            priceSale: { gte: 5000000, lte: 10000000 },
          }),
        }),
      );
    });

    it('should default price filter to priceRent for RENT', async () => {
      mockPrisma.property.findMany.mockResolvedValue([]);
      mockPrisma.property.count.mockResolvedValue(0);

      await service.searchProperties({
        transactionType: 'RENT',
        priceMin: 10000,
      } as any);

      expect(mockPrisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            priceRent: { gte: 10000 },
          }),
        }),
      );
    });

    it('should return paginated results', async () => {
      mockPrisma.property.findMany.mockResolvedValue([{ id: 'p-1' }]);
      mockPrisma.property.count.mockResolvedValue(1);

      const result = await service.searchProperties({ page: '2', limit: '10' } as any);
      expect(result).toEqual({ data: [{ id: 'p-1' }], total: 1, page: 2, limit: 10 });
    });
  });
});
