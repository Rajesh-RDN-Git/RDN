import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { PrismaService } from '../../database/prisma.service';

describe('VerificationService', () => {
  let service: VerificationService;

  const mockPrisma = {
    society: { findUnique: jest.fn(), update: jest.fn() },
    property: { findUnique: jest.fn(), update: jest.fn() },
    dealer: { findUnique: jest.fn(), update: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VerificationService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<VerificationService>(VerificationService);
    jest.clearAllMocks();
  });

  describe('verifySociety', () => {
    it('should verify PENDING society', async () => {
      mockPrisma.society.findUnique.mockResolvedValue({ id: 's-1', verificationStatus: 'PENDING' });
      mockPrisma.society.update.mockResolvedValue({
        verificationStatus: 'VERIFIED',
        status: 'ONBOARDED',
      });

      const result = await service.verifySociety('s-1', { status: 'VERIFIED' });
      expect(result.verificationStatus).toBe('VERIFIED');
    });

    it('should throw for invalid transition', async () => {
      mockPrisma.society.findUnique.mockResolvedValue({
        id: 's-1',
        verificationStatus: 'VERIFIED',
      });
      await expect(service.verifySociety('s-1', { status: 'PENDING' } as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.society.findUnique.mockResolvedValue(null);
      await expect(service.verifySociety('x', { status: 'VERIFIED' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('verifyProperty', () => {
    it('should approve pending property through RWA', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({
        id: 'p-1',
        verificationStatus: 'PENDING',
      });
      mockPrisma.property.update.mockResolvedValue({ verificationStatus: 'RWA_APPROVED' });

      const result = await service.verifyProperty('p-1', { status: 'RWA_APPROVED' });
      expect(result.verificationStatus).toBe('RWA_APPROVED');
    });

    it('should throw for invalid transition', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({
        id: 'p-1',
        verificationStatus: 'VERIFIED',
      });
      await expect(service.verifyProperty('p-1', { status: 'PENDING' } as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('verifyDealer', () => {
    it('should approve and activate if all checks pass', async () => {
      mockPrisma.dealer.findUnique.mockResolvedValue({
        id: 'd-1',
        kycStatus: 'PENDING',
        rwaApprovalStatus: 'APPROVED',
        trainingStatus: 'COMPLETED',
      });
      mockPrisma.dealer.update.mockResolvedValue({ kycStatus: 'APPROVED', isActive: true });

      const result = await service.verifyDealer('d-1', { kycStatus: 'APPROVED' });
      expect(mockPrisma.dealer.update).toHaveBeenCalledWith({
        where: { id: 'd-1' },
        data: { kycStatus: 'APPROVED', isActive: true },
      });
    });

    it('should approve but not activate if RWA not approved', async () => {
      mockPrisma.dealer.findUnique.mockResolvedValue({
        id: 'd-1',
        kycStatus: 'PENDING',
        rwaApprovalStatus: 'PENDING',
        trainingStatus: 'COMPLETED',
      });
      mockPrisma.dealer.update.mockResolvedValue({ kycStatus: 'APPROVED', isActive: false });

      await service.verifyDealer('d-1', { kycStatus: 'APPROVED' });
      expect(mockPrisma.dealer.update).toHaveBeenCalledWith({
        where: { id: 'd-1' },
        data: { kycStatus: 'APPROVED' },
      });
    });

    it('should throw for invalid KYC transition', async () => {
      mockPrisma.dealer.findUnique.mockResolvedValue({ id: 'd-1', kycStatus: 'APPROVED' });
      await expect(service.verifyDealer('d-1', { kycStatus: 'PENDING' } as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
