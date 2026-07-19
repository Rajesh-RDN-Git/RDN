import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { GrievanceService } from './grievance.service';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('GrievanceService', () => {
  let service: GrievanceService;

  const mockPrisma = {
    grievance: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    user: { findMany: jest.fn() },
  };

  const mockNotificationsService = { create: jest.fn().mockResolvedValue({}) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GrievanceService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<GrievanceService>(GrievanceService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should scope to own grievances for non-admin', async () => {
      mockPrisma.grievance.findMany.mockResolvedValue([]);
      mockPrisma.grievance.count.mockResolvedValue(0);

      await service.findAll({} as any, 'user-1', 'DEALER');
      expect(mockPrisma.grievance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ filedBy: 'user-1' }),
        }),
      );
    });

    it('should not scope for SUPER_ADMIN', async () => {
      mockPrisma.grievance.findMany.mockResolvedValue([]);
      mockPrisma.grievance.count.mockResolvedValue(0);

      await service.findAll({} as any, 'admin-1', 'SUPER_ADMIN');
      expect(mockPrisma.grievance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({ filedBy: expect.anything() }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return grievance', async () => {
      mockPrisma.grievance.findUnique.mockResolvedValue({ id: 'g-1' });
      expect(await service.findOne('g-1')).toEqual({ id: 'g-1' });
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.grievance.findUnique.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });

    it('forbids a non-filer non-admin from reading a grievance (IDOR)', async () => {
      mockPrisma.grievance.findUnique.mockResolvedValue({
        id: 'g-1',
        filedBy: 'filer-user',
        society: { rwaAdminId: 'rwa-user' },
      });
      await expect(
        service.findOne('g-1', { id: 'stranger', role: 'BUYER_TENANT' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows the filer to read their own grievance', async () => {
      mockPrisma.grievance.findUnique.mockResolvedValue({
        id: 'g-1',
        filedBy: 'filer-user',
        society: { rwaAdminId: 'rwa-user' },
      });
      const result = await service.findOne('g-1', { id: 'filer-user', role: 'BUYER_TENANT' });
      expect(result.id).toBe('g-1');
    });
  });

  describe('create', () => {
    it('should create grievance with SLA deadline and notify admins', async () => {
      mockPrisma.grievance.create.mockResolvedValue({ id: 'g-1' });
      mockPrisma.user.findMany.mockResolvedValue([{ id: 'admin-1' }, { id: 'admin-2' }]);

      await service.create(
        {
          category: 'FRAUD',
          severity: 'HIGH',
          description: 'Test complaint',
        } as any,
        'user-1',
      );

      expect(mockPrisma.grievance.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            filedBy: 'user-1',
            category: 'FRAUD',
            severity: 'HIGH',
            slaDeadline: expect.any(Date),
          }),
        }),
      );
      // Should notify each admin
      expect(mockNotificationsService.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('update', () => {
    it('should update status and set resolvedAt for RESOLVED', async () => {
      mockPrisma.grievance.findUnique.mockResolvedValue({ id: 'g-1', filedBy: 'user-1' });
      mockPrisma.grievance.update.mockResolvedValue({ id: 'g-1', status: 'RESOLVED' });

      await service.update('g-1', { status: 'RESOLVED' });

      expect(mockPrisma.grievance.update).toHaveBeenCalledWith({
        where: { id: 'g-1' },
        data: expect.objectContaining({
          status: 'RESOLVED',
          resolvedAt: expect.any(Date),
        }),
      });
      expect(mockNotificationsService.create).toHaveBeenCalled();
    });
  });

  describe('escalate', () => {
    it('should escalate open grievance', async () => {
      mockPrisma.grievance.findUnique.mockResolvedValue({ id: 'g-1', status: 'OPEN' });
      mockPrisma.grievance.update.mockResolvedValue({ status: 'ESCALATED', escalationLevel: 2 });

      const result = await service.escalate('g-1');
      expect(mockPrisma.grievance.update).toHaveBeenCalledWith({
        where: { id: 'g-1' },
        data: { status: 'ESCALATED', escalationLevel: { increment: 1 } },
      });
    });

    it('should throw if grievance is resolved', async () => {
      mockPrisma.grievance.findUnique.mockResolvedValue({ id: 'g-1', status: 'RESOLVED' });
      await expect(service.escalate('g-1')).rejects.toThrow(BadRequestException);
    });
  });
});
