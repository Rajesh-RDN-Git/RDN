import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ReferralService } from './referral.service';
import { PrismaService } from '../../database/prisma.service';

describe('ReferralService', () => {
  let service: ReferralService;

  const mockPrisma = {
    referral: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReferralService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<ReferralService>(ReferralService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated referrals for user', async () => {
      mockPrisma.referral.findMany.mockResolvedValue([{ id: 'r-1' }]);
      mockPrisma.referral.count.mockResolvedValue(1);

      const result = await service.findAll({} as any, 'user-1');
      expect(result).toEqual({ data: [{ id: 'r-1' }], total: 1, page: 1, limit: 20 });
    });
  });

  describe('generateCode', () => {
    it('should return existing code if user has one', async () => {
      mockPrisma.referral.findFirst.mockResolvedValue({ id: 'r-1', referralCode: 'RDN-ABC123' });

      const result = await service.generateCode('user-1');
      expect(result).toEqual({ code: 'RDN-ABC123', id: 'r-1' });
    });

    it('should create new code if none exists', async () => {
      mockPrisma.referral.findFirst.mockResolvedValue(null);
      mockPrisma.referral.create.mockResolvedValue({ id: 'r-new', referralCode: 'RDN-XYZ789' });

      const result = await service.generateCode('user-1');
      expect(result.code).toMatch(/^RDN-/);
    });
  });

  describe('validateCode', () => {
    it('should validate existing code', async () => {
      mockPrisma.referral.findUnique.mockResolvedValue({
        referralCode: 'RDN-ABC123',
        referrer: { id: 'user-1', name: 'Test' },
      });

      const result = await service.validateCode('RDN-ABC123');
      expect(result.valid).toBe(true);
    });

    it('should throw NotFoundException for invalid code', async () => {
      mockPrisma.referral.findUnique.mockResolvedValue(null);
      await expect(service.validateCode('INVALID')).rejects.toThrow(NotFoundException);
    });
  });

  describe('applyCode', () => {
    it('should apply referral code', async () => {
      mockPrisma.referral.findUnique.mockResolvedValue({
        id: 'r-1',
        referrerId: 'user-1',
        referredId: null,
      });
      mockPrisma.referral.update.mockResolvedValue({ status: 'SIGNED_UP' });

      const result = await service.applyCode('RDN-ABC123', 'user-2');
      expect(mockPrisma.referral.update).toHaveBeenCalledWith({
        where: { id: 'r-1' },
        data: { referredId: 'user-2', status: 'SIGNED_UP' },
      });
    });

    it('should throw ConflictException for own code', async () => {
      mockPrisma.referral.findUnique.mockResolvedValue({
        id: 'r-1',
        referrerId: 'user-1',
        referredId: null,
      });
      await expect(service.applyCode('RDN-ABC123', 'user-1')).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if code already used', async () => {
      mockPrisma.referral.findUnique.mockResolvedValue({
        id: 'r-1',
        referrerId: 'user-1',
        referredId: 'user-3',
      });
      await expect(service.applyCode('RDN-ABC123', 'user-2')).rejects.toThrow(ConflictException);
    });
  });

  describe('processReferralReward', () => {
    it('should process reward at 5% of dealer commission', async () => {
      mockPrisma.referral.findFirst.mockResolvedValue({ id: 'r-1', referredId: 'user-2' });
      mockPrisma.referral.update.mockResolvedValue({ status: 'REWARDED', rewardAmount: 2500 });

      const result = await service.processReferralReward('user-2', 50000);
      expect(mockPrisma.referral.update).toHaveBeenCalledWith({
        where: { id: 'r-1' },
        data: { status: 'REWARDED', rewardAmount: 2500 },
      });
    });

    it('should return null if no referral found', async () => {
      mockPrisma.referral.findFirst.mockResolvedValue(null);
      const result = await service.processReferralReward('user-2', 50000);
      expect(result).toBeNull();
    });
  });
});
