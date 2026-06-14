import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsGateway } from './notifications.gateway';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockPrisma = {
    notification: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    society: { findUnique: jest.fn() },
    user: { findMany: jest.fn() },
  };

  const mockGateway = { emitNotification: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated notifications with unread count', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([{ id: 'n-1' }]);
      mockPrisma.notification.count
        .mockResolvedValueOnce(1) // total
        .mockResolvedValueOnce(1); // unreadCount

      const result = await service.findAll({} as any, 'user-1');
      expect(result).toEqual({
        data: [{ id: 'n-1' }],
        total: 1,
        unreadCount: 1,
        page: 1,
        limit: 20,
      });
    });

    it('should filter unread only', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(0);

      await service.findAll({ unreadOnly: 'true' } as any, 'user-1');
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-1', readAt: null }),
        }),
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({ id: 'n-1', userId: 'user-1' });
      mockPrisma.notification.update.mockResolvedValue({ id: 'n-1', readAt: new Date() });

      const result = await service.markAsRead('n-1', 'user-1');
      expect(result.readAt).toBeDefined();
    });

    it('should throw NotFoundException if notification belongs to another user', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({ id: 'n-1', userId: 'other-user' });
      await expect(service.markAsRead('n-1', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 });
      const result = await service.markAllAsRead('user-1');
      expect(result).toEqual({ marked: 5 });
    });
  });

  describe('create', () => {
    it('should create notification and emit via gateway', async () => {
      mockPrisma.notification.create.mockResolvedValue({ id: 'n-1', userId: 'user-1' });

      await service.create({
        userId: 'user-1',
        type: 'LEAD',
        title: 'New Lead',
        body: 'New lead assigned',
        channel: 'IN_APP',
      });

      expect(mockPrisma.notification.create).toHaveBeenCalled();
      expect(mockGateway.emitNotification).toHaveBeenCalledWith('user-1', {
        id: 'n-1',
        userId: 'user-1',
      });
    });
  });

  describe('notifySocietyApprovers', () => {
    const payload = {
      type: 'SYSTEM',
      title: 'New Dealer Application',
      body: 'Asha applied.',
      channel: 'IN_APP' as const,
    };

    it('notifies the society RWA admin when one is assigned', async () => {
      mockPrisma.society.findUnique.mockResolvedValue({ rwaAdminId: 'rwa-1' });
      mockPrisma.notification.create.mockResolvedValue({ id: 'n-1', userId: 'rwa-1' });

      await service.notifySocietyApprovers('soc-1', payload);

      expect(mockPrisma.user.findMany).not.toHaveBeenCalled();
      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: 'rwa-1' }) }),
      );
    });

    it('falls back to all active SUPER_ADMINs when no RWA admin is assigned', async () => {
      mockPrisma.society.findUnique.mockResolvedValue({ rwaAdminId: null });
      mockPrisma.user.findMany.mockResolvedValue([{ id: 'sa-1' }, { id: 'sa-2' }]);
      mockPrisma.notification.create.mockResolvedValue({ id: 'n-1' });

      await service.notifySocietyApprovers('soc-1', payload);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { role: 'SUPER_ADMIN', status: 'ACTIVE' },
        select: { id: true },
      });
      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(2);
      const recipients = mockPrisma.notification.create.mock.calls.map((c) => c[0].data.userId);
      expect(recipients).toEqual(['sa-1', 'sa-2']);
    });

    it('falls back to SUPER_ADMINs when the society is missing', async () => {
      mockPrisma.society.findUnique.mockResolvedValue(null);
      mockPrisma.user.findMany.mockResolvedValue([{ id: 'sa-1' }]);
      mockPrisma.notification.create.mockResolvedValue({ id: 'n-1' });

      await service.notifySocietyApprovers('soc-1', payload);

      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
    });
  });
});
