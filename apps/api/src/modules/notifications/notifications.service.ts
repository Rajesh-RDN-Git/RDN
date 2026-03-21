import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import type { QueryNotificationsDto } from './dto/query-notifications.dto';
import type { CreateNotificationDto } from './dto/create-notification.dto';
import type { Prisma } from '@rdn/db';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly gateway?: NotificationsGateway,
  ) {}

  async findAll(query: QueryNotificationsDto, userId: string): Promise<any> {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = { userId };
    if (query.type) where.type = query.type as any;
    if (query.unreadOnly === 'true') where.readAt = null;

    const [data, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    return { data, total, unreadCount, page, limit };
  }

  async markAsRead(id: string, userId: string): Promise<any> {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.userId !== userId) throw new NotFoundException('Notification not found');

    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string): Promise<any> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });

    return { marked: result.count };
  }

  async create(data: CreateNotificationDto): Promise<any> {
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type as any,
        title: data.title,
        body: data.body,
        channel: (data.channel as any) || 'IN_APP',
        data: (data.data || {}) as any,
      },
    });

    // Emit real-time notification via WebSocket
    if (this.gateway) {
      this.gateway.emitNotification(data.userId, notification);
    }

    return notification;
  }
}
