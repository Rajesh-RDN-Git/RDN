import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CommissionService } from './commission.service';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('CommissionService', () => {
  let service: CommissionService;

  const mockPrisma = {
    commission: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockNotificationsService = { create: jest.fn().mockResolvedValue({}) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<CommissionService>(CommissionService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated commissions', async () => {
      mockPrisma.commission.findMany.mockResolvedValue([{ id: 'c-1' }]);
      mockPrisma.commission.count.mockResolvedValue(1);

      const result = await service.findAll({} as any);
      expect(result).toEqual({ data: [{ id: 'c-1' }], total: 1, page: 1, limit: 20 });
    });
  });

  describe('findOne', () => {
    it('should return commission', async () => {
      mockPrisma.commission.findUnique.mockResolvedValue({ id: 'c-1' });
      expect(await service.findOne('c-1')).toEqual({ id: 'c-1' });
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.commission.findUnique.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('settle', () => {
    it('should settle PENDING commission', async () => {
      mockPrisma.commission.findUnique.mockResolvedValue({
        id: 'c-1',
        status: 'PENDING',
        amount: 50000,
        dealer: { userId: 'user-1' },
      });
      mockPrisma.commission.update.mockResolvedValue({ id: 'c-1', status: 'SETTLED' });

      const result = await service.settle('c-1', { payoutReference: 'PAY-123' });
      expect(result.status).toBe('SETTLED');
      expect(mockNotificationsService.create).toHaveBeenCalled();
    });

    it('should throw if already settled', async () => {
      mockPrisma.commission.findUnique.mockResolvedValue({
        id: 'c-1',
        status: 'SETTLED',
        dealer: { userId: 'user-1' },
      });

      await expect(service.settle('c-1', { payoutReference: 'PAY-123' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.commission.findUnique.mockResolvedValue(null);
      await expect(service.settle('x', { payoutReference: 'PAY-123' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('cancel', () => {
    it('should cancel PENDING commission', async () => {
      mockPrisma.commission.findUnique.mockResolvedValue({ id: 'c-1', status: 'PENDING' });
      mockPrisma.commission.update.mockResolvedValue({ id: 'c-1', status: 'CANCELLED' });

      const result = await service.cancel('c-1');
      expect(result.status).toBe('CANCELLED');
    });

    it('should throw if not PENDING', async () => {
      mockPrisma.commission.findUnique.mockResolvedValue({ id: 'c-1', status: 'SETTLED' });
      await expect(service.cancel('c-1')).rejects.toThrow(BadRequestException);
    });
  });
});
