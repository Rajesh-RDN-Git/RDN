import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('PropertiesService', () => {
  let service: PropertiesService;

  const mockPrisma = {
    property: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    society: { findUnique: jest.fn() },
  };

  const mockNotificationsService = {
    notifySocietyApprovers: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertiesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<PropertiesService>(PropertiesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated properties with ACTIVE default', async () => {
      mockPrisma.property.findMany.mockResolvedValue([]);
      mockPrisma.property.count.mockResolvedValue(0);

      await service.findAll({} as any);

      expect(mockPrisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'ACTIVE' }),
        }),
      );
    });

    it('should apply filters', async () => {
      mockPrisma.property.findMany.mockResolvedValue([]);
      mockPrisma.property.count.mockResolvedValue(0);

      await service.findAll({ societyId: 'soc-1', type: 'APARTMENT', bhk: '3' } as any);

      expect(mockPrisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            societyId: 'soc-1',
            type: 'APARTMENT',
            bhk: 3,
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return property and increment views', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({ id: 'prop-1' });
      mockPrisma.property.update.mockResolvedValue({});

      const result = await service.findOne('prop-1');

      expect(result).toEqual({ id: 'prop-1' });
      expect(mockPrisma.property.update).toHaveBeenCalledWith({
        where: { id: 'prop-1' },
        data: { viewsCount: { increment: 1 } },
      });
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.property.findUnique.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create property after verifying society and alert approvers', async () => {
      mockPrisma.society.findUnique.mockResolvedValue({ id: 'soc-1' });
      mockPrisma.property.create.mockResolvedValue({
        id: 'prop-1',
        society: { name: 'Sunrise Heights' },
      });

      const result = await service.create(
        {
          societyId: 'soc-1',
          flatNumber: 'A-101',
          towerBlock: 'Tower A',
          type: 'APARTMENT',
          transactionType: 'SALE',
          bhk: 3,
          carpetArea: 1200,
        } as any,
        'owner-1',
      );

      expect(result).toMatchObject({ id: 'prop-1' });
      expect(mockNotificationsService.notifySocietyApprovers).toHaveBeenCalledWith(
        'soc-1',
        expect.objectContaining({ type: 'SYSTEM' }),
      );
    });

    it('should throw if society not found', async () => {
      mockPrisma.society.findUnique.mockResolvedValue(null);
      await expect(service.create({ societyId: 'x' } as any, 'owner-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should allow SUPER_ADMIN to update any property', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({
        id: 'prop-1',
        ownerId: 'other',
        verificationStatus: 'PENDING',
      });
      mockPrisma.property.update.mockResolvedValue({ id: 'prop-1' });

      await service.update('prop-1', { bhk: 4 } as any, 'admin-1', 'SUPER_ADMIN');

      expect(mockPrisma.property.update).toHaveBeenCalled();
    });

    it('re-enters the verification queue when a reviewed listing is edited', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({
        id: 'prop-1',
        ownerId: 'owner-1',
        societyId: 'soc-1',
        verificationStatus: 'VERIFIED',
      });
      mockPrisma.property.update.mockResolvedValue({
        id: 'prop-1',
        societyId: 'soc-1',
        society: { id: 'soc-1', name: 'Sunrise' },
      });

      await service.update('prop-1', { bhk: 4 } as any, 'owner-1', 'OWNER');

      // verificationStatus reset back to PENDING on the update payload
      expect(mockPrisma.property.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ verificationStatus: 'PENDING' }),
        }),
      );
      expect(mockNotificationsService.notifySocietyApprovers).toHaveBeenCalledWith(
        'soc-1',
        expect.objectContaining({ title: expect.stringContaining('Re-verification') }),
      );
    });

    it('does NOT re-verify when only operational status changes', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({
        id: 'prop-1',
        ownerId: 'owner-1',
        verificationStatus: 'VERIFIED',
      });
      mockPrisma.property.update.mockResolvedValue({ id: 'prop-1' });

      await service.update('prop-1', { status: 'DELISTED' } as any, 'owner-1', 'OWNER');

      expect(mockPrisma.property.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({ verificationStatus: 'PENDING' }),
        }),
      );
    });

    it('should throw ForbiddenException for OWNER updating others property', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({ id: 'prop-1', ownerId: 'other' });

      await expect(service.update('prop-1', {} as any, 'wrong-owner', 'OWNER')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('delist', () => {
    it('should delist property', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({ id: 'prop-1', ownerId: 'owner-1' });
      mockPrisma.property.update.mockResolvedValue({ status: 'DELISTED' });

      const result = await service.delist('prop-1', 'owner-1', 'OWNER');
      expect(result.status).toBe('DELISTED');
    });

    it('should throw ForbiddenException for wrong owner', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({ id: 'prop-1', ownerId: 'other' });

      await expect(service.delist('prop-1', 'wrong', 'OWNER')).rejects.toThrow(ForbiddenException);
    });
  });
});
