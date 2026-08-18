import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ChatGateway } from '@/chat/chat.gateway';
import { sanitizeUser } from '@/users/users.util';
import type { NotificationType } from '../../generated/prisma/client';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async notifyUser(
    userId: string,
    type: NotificationType,
    actorId: string,
    contactId: string | null,
  ) {
    const notification = await this.prisma.notification.create({
      data: { userId, type, actorId, contactId },
      include: { actor: true },
    });

    const payload = {
      id: notification.id,
      type: notification.type,
      contactId: notification.contactId,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
      actor: notification.actor ? sanitizeUser(notification.actor) : null,
    };

    this.chatGateway.server.to(`user:${userId}`).emit('notification', payload);

    return notification;
  }

  async findMany(userId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      include: { actor: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      contactId: notification.contactId,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
      actor: notification.actor ? sanitizeUser(notification.actor) : null,
    }));
  }

  markAsRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { readAt: new Date() },
    });
  }

  markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}
