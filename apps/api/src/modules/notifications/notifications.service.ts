import { Injectable } from '@nestjs/common';
import type { PrismaService } from '../../database/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    // TODO: List notifications for current user with pagination
    return { data: [], total: 0, unreadCount: 0 };
  }

  async markAsRead(id: string) {
    // TODO: Mark single notification as read
    return { id, read: true };
  }

  async markAllAsRead() {
    // TODO: Mark all notifications for current user as read
    return { message: 'All notifications marked as read' };
  }
}
