import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '../../database/prisma.service';
import { EncryptionService } from '../../common/crypto/encryption.service';

describe('AdminService', () => {
  let service: AdminService;

  const mockPrisma = {
    user: { count: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    society: { count: jest.fn(), findUnique: jest.fn(), create: jest.fn(), updateMany: jest.fn() },
    property: { count: jest.fn() },
    dealer: { count: jest.fn(), updateMany: jest.fn() },
    lead: { count: jest.fn() },
    grievance: { count: jest.fn() },
  };

  const mockEncryption = { blindIndex: jest.fn((v: string) => `hash(${v})`) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EncryptionService, useValue: mockEncryption },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    jest.clearAllMocks();
  });

  describe('getStats', () => {
    it('should return platform statistics', async () => {
      mockPrisma.user.count.mockResolvedValue(100);
      mockPrisma.society.count
        .mockResolvedValueOnce(10) // totalSocieties
        .mockResolvedValueOnce(2) // pendingSocieties
        .mockResolvedValueOnce(8); // activeSocieties
      mockPrisma.property.count
        .mockResolvedValueOnce(50) // totalProperties
        .mockResolvedValueOnce(5); // pendingProperties
      mockPrisma.dealer.count.mockResolvedValue(15);
      mockPrisma.lead.count.mockResolvedValue(30);
      mockPrisma.grievance.count.mockResolvedValue(3);

      const result = await service.getStats();

      expect(result.totalUsers).toBe(100);
      expect(result.totalSocieties).toBe(10);
      expect(result.totalProperties).toBe(50);
      expect(result.totalDealers).toBe(15);
      expect(result.totalLeads).toBe(30);
      expect(result.pendingVerifications).toBe(7); // 2 + 5
      expect(result.openGrievances).toBe(3);
    });
  });

  describe('getUsers', () => {
    it('should return paginated users', async () => {
      mockPrisma.user.findMany.mockResolvedValue([{ id: 'u-1' }]);
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await service.getUsers({} as any);
      expect(result).toEqual({ data: [{ id: 'u-1' }], total: 1, page: 1, limit: 20 });
    });

    it('should apply search filter', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await service.getUsers({ search: 'John' } as any);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: { contains: 'John', mode: 'insensitive' } }),
            ]),
          }),
        }),
      );
    });

    it('matches a phone-shaped search against the blind index', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await service.getUsers({ search: '+919999900001' } as any);

      expect(mockEncryption.blindIndex).toHaveBeenCalledWith('+919999900001');
      const arg = mockPrisma.user.findMany.mock.calls[0][0];
      expect(arg.where.OR).toEqual(expect.arrayContaining([{ phoneHash: 'hash(+919999900001)' }]));
    });
  });

  describe('onboardSociety', () => {
    it('should create society with verified status', async () => {
      mockPrisma.society.findUnique.mockResolvedValue(null);
      mockPrisma.society.create.mockResolvedValue({ id: 's-1', status: 'ONBOARDED' });

      const result = await service.onboardSociety({
        name: 'Test Society',
        slug: 'test-society',
        address: '123 St',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        totalUnits: 200,
      } as any);

      expect(mockPrisma.society.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'ONBOARDED',
          verificationStatus: 'VERIFIED',
        }),
      });
    });

    it('should throw ConflictException for duplicate slug', async () => {
      mockPrisma.society.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(service.onboardSociety({ slug: 'existing' } as any)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should update user role to RWA_ADMIN if rwaAdminId provided', async () => {
      mockPrisma.society.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u-1', role: 'BUYER_TENANT' });
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.society.create.mockResolvedValue({ id: 's-1' });

      await service.onboardSociety({
        name: 'Test',
        slug: 'test',
        address: '123 St',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        totalUnits: 200,
        rwaAdminId: 'u-1',
      } as any);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u-1' },
        data: { role: 'RWA_ADMIN' },
      });
    });
  });

  describe('setUserRole', () => {
    const actor = { id: 'admin-1', role: 'SUPER_ADMIN' };

    it('promotes a buyer to a standalone role', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u-2', role: 'BUYER_TENANT' });
      mockPrisma.user.update.mockResolvedValue({ id: 'u-2', role: 'OWNER' });

      const result = await service.setUserRole('u-2', 'OWNER', actor);

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'u-2' }, data: { role: 'OWNER' } }),
      );
      expect(result).toEqual({ id: 'u-2', role: 'OWNER' });
    });

    it('throws NotFound when the user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.setUserRole('missing', 'OWNER', actor)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects assigning DEALER (needs the Add-Dealer flow)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u-2', role: 'BUYER_TENANT' });
      await expect(service.setUserRole('u-2', 'DEALER', actor)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects assigning RWA_ADMIN (needs the society assignment flow)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u-2', role: 'BUYER_TENANT' });
      await expect(service.setUserRole('u-2', 'RWA_ADMIN', actor)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('blocks an admin from removing their own super-admin role', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'admin-1', role: 'SUPER_ADMIN' });
      await expect(service.setUserRole('admin-1', 'OWNER', actor)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('blocks demoting the last active super admin', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u-9', role: 'SUPER_ADMIN' });
      mockPrisma.user.count.mockResolvedValue(1);
      await expect(service.setUserRole('u-9', 'OWNER', actor)).rejects.toThrow(BadRequestException);
    });

    it('allows demoting a super admin when others remain', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u-9', role: 'SUPER_ADMIN' });
      mockPrisma.user.count.mockResolvedValue(3);
      mockPrisma.user.update.mockResolvedValue({ id: 'u-9', role: 'OWNER' });

      await service.setUserRole('u-9', 'OWNER', actor);
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });

    it('clears RWA links when demoting an RWA admin', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u-3', role: 'RWA_ADMIN' });
      mockPrisma.society.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.user.update.mockResolvedValue({ id: 'u-3', role: 'OWNER' });

      await service.setUserRole('u-3', 'OWNER', actor);

      expect(mockPrisma.society.updateMany).toHaveBeenCalledWith({
        where: { rwaAdminId: 'u-3' },
        data: { rwaAdminId: null },
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { role: 'OWNER', primarySocietyId: null } }),
      );
    });

    it('deactivates dealer rows when demoting a dealer', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u-4', role: 'DEALER' });
      mockPrisma.dealer.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.user.update.mockResolvedValue({ id: 'u-4', role: 'OWNER' });

      await service.setUserRole('u-4', 'OWNER', actor);

      expect(mockPrisma.dealer.updateMany).toHaveBeenCalledWith({
        where: { userId: 'u-4' },
        data: { isActive: false },
      });
    });
  });
});
