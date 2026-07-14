import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { DealersService } from './dealers.service';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('DealersService', () => {
  let service: DealersService;

  const mockPrisma = {
    dealer: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    lead: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
    society: { findUnique: jest.fn() },
  };

  const mockNotificationsService = {
    create: jest.fn().mockResolvedValue({}),
    notifySocietyApprovers: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DealersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<DealersService>(DealersService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated dealers', async () => {
      mockPrisma.dealer.findMany.mockResolvedValue([{ id: 'd-1' }]);
      mockPrisma.dealer.count.mockResolvedValue(1);

      const result = await service.findAll({} as any);
      expect(result).toEqual({ data: [{ id: 'd-1' }], total: 1, page: 1, limit: 20 });
    });
  });

  describe('findOne', () => {
    it('should return dealer by id', async () => {
      mockPrisma.dealer.findUnique.mockResolvedValue({ id: 'd-1' });
      expect(await service.findOne('d-1')).toEqual({ id: 'd-1' });
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.dealer.findUnique.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('apply', () => {
    it('should create dealer application and alert society approvers', async () => {
      mockPrisma.society.findUnique.mockResolvedValue({ id: 'soc-1' });
      mockPrisma.dealer.findUnique.mockResolvedValue(null);
      mockPrisma.dealer.create.mockResolvedValue({
        id: 'd-1',
        user: { name: 'Asha' },
        society: { name: 'Sunrise Heights' },
      });

      const result = await service.apply({ societyId: 'soc-1' } as any, 'user-1');
      expect(result).toMatchObject({ id: 'd-1' });
      expect(mockNotificationsService.notifySocietyApprovers).toHaveBeenCalledWith(
        'soc-1',
        expect.objectContaining({ type: 'SYSTEM', title: 'New Dealer Application' }),
      );
    });

    it('should throw NotFoundException if society not found', async () => {
      mockPrisma.society.findUnique.mockResolvedValue(null);
      await expect(service.apply({ societyId: 'x' } as any, 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if already applied', async () => {
      mockPrisma.society.findUnique.mockResolvedValue({ id: 'soc-1' });
      mockPrisma.dealer.findUnique.mockResolvedValue({ id: 'd-existing' });
      await expect(service.apply({ societyId: 'soc-1' } as any, 'user-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('approve', () => {
    it('should approve and activate if all checks pass', async () => {
      mockPrisma.dealer.findUnique.mockResolvedValue({
        id: 'd-1',
        userId: 'user-1',
        kycStatus: 'APPROVED',
        trainingStatus: 'COMPLETED',
      });
      mockPrisma.dealer.update.mockResolvedValue({ id: 'd-1', isActive: true });

      const result = await service.approve('d-1');
      expect(mockPrisma.dealer.update).toHaveBeenCalledWith({
        where: { id: 'd-1' },
        data: { rwaApprovalStatus: 'APPROVED', isActive: true },
      });
      expect(mockNotificationsService.create).toHaveBeenCalled();
    });

    it('should approve but not activate if KYC pending', async () => {
      mockPrisma.dealer.findUnique.mockResolvedValue({
        id: 'd-1',
        userId: 'user-1',
        kycStatus: 'PENDING',
        trainingStatus: 'COMPLETED',
      });
      mockPrisma.dealer.update.mockResolvedValue({ id: 'd-1', isActive: false });

      await service.approve('d-1');
      expect(mockPrisma.dealer.update).toHaveBeenCalledWith({
        where: { id: 'd-1' },
        data: { rwaApprovalStatus: 'APPROVED', isActive: false },
      });
    });
  });

  describe('reject', () => {
    it('should reject and deactivate', async () => {
      mockPrisma.dealer.findUnique.mockResolvedValue({ id: 'd-1', userId: 'user-1' });
      mockPrisma.dealer.update.mockResolvedValue({ id: 'd-1', isActive: false });

      await service.reject('d-1');
      expect(mockPrisma.dealer.update).toHaveBeenCalledWith({
        where: { id: 'd-1' },
        data: { rwaApprovalStatus: 'REJECTED', isActive: false },
      });
    });
  });

  describe('updateKyc', () => {
    it('should activate dealer when all three checks pass', async () => {
      mockPrisma.dealer.findUnique.mockResolvedValue({
        id: 'd-1',
        rwaApprovalStatus: 'APPROVED',
        trainingStatus: 'COMPLETED',
      });
      mockPrisma.dealer.update.mockResolvedValue({ isActive: true });

      await service.updateKyc('d-1', 'APPROVED');
      expect(mockPrisma.dealer.update).toHaveBeenCalledWith({
        where: { id: 'd-1' },
        data: { kycStatus: 'APPROVED', isActive: true },
      });
    });

    it('should not activate if training incomplete', async () => {
      mockPrisma.dealer.findUnique.mockResolvedValue({
        id: 'd-1',
        rwaApprovalStatus: 'APPROVED',
        trainingStatus: 'PENDING',
      });
      mockPrisma.dealer.update.mockResolvedValue({ isActive: false });

      await service.updateKyc('d-1', 'APPROVED');
      expect(mockPrisma.dealer.update).toHaveBeenCalledWith({
        where: { id: 'd-1' },
        data: { kycStatus: 'APPROVED', isActive: false },
      });
    });
  });

  describe('completeTraining', () => {
    it('should activate when all checks pass', async () => {
      mockPrisma.dealer.findUnique.mockResolvedValue({
        id: 'd-1',
        kycStatus: 'APPROVED',
        rwaApprovalStatus: 'APPROVED',
      });
      mockPrisma.dealer.update.mockResolvedValue({ isActive: true });

      await service.completeTraining('d-1');
      expect(mockPrisma.dealer.update).toHaveBeenCalledWith({
        where: { id: 'd-1' },
        data: { trainingStatus: 'COMPLETED', isActive: true },
      });
    });
  });

  describe('claimUnassignedLeads on activation', () => {
    it('claims queued leads in the society when a dealer becomes active', async () => {
      mockPrisma.dealer.findUnique
        .mockResolvedValueOnce({
          id: 'd-1',
          userId: 'user-1',
          societyId: 'soc-1',
          isActive: false,
          kycStatus: 'APPROVED',
          trainingStatus: 'COMPLETED',
        })
        .mockResolvedValueOnce({ userId: 'user-1' });
      mockPrisma.dealer.update.mockResolvedValue({ id: 'd-1', isActive: true });
      mockPrisma.lead.updateMany.mockResolvedValueOnce({ count: 2 });

      await service.approve('d-1');

      expect(mockPrisma.lead.updateMany).toHaveBeenCalledWith({
        where: { societyId: 'soc-1', dealerId: null },
        data: { dealerId: 'd-1' },
      });
    });

    it('does not claim leads if dealer was already active', async () => {
      mockPrisma.dealer.findUnique.mockResolvedValue({
        id: 'd-1',
        userId: 'user-1',
        societyId: 'soc-1',
        isActive: true,
        kycStatus: 'APPROVED',
        trainingStatus: 'COMPLETED',
      });
      mockPrisma.dealer.update.mockResolvedValue({ id: 'd-1', isActive: true });

      await service.approve('d-1');

      expect(mockPrisma.lead.updateMany).not.toHaveBeenCalled();
    });
  });
});
