import { prisma } from '../config/database';
import { type Prisma } from '@detrust/database';
import { getIO } from '../config/socket';
import { NotFoundError, ForbiddenError } from '../middleware';

interface GetNotificationsParams {
  limit?: number;
  unreadOnly?: boolean;
}

interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export class NotificationService {
  /**
   * Create a notification, persist it to the DB, and push it over
   * the WebSocket so the recipient sees it in real time.
   */
  async createNotification(params: CreateNotificationParams) {
    const { userId, type, title, message, data } = params;

    const notification = await prisma.notification.create({
      data: {
        userId,
        type: type as any,
        title,
        message,
        data: (data ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });

    // Push to the user's private socket room
    const io = getIO();
    if (io) {
      io.to(`user:${notification.userId}`).emit('notification:new', notification);
    }

    return notification;
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(userId: string, params: GetNotificationsParams = {}) {
    const { limit = 50, unreadOnly = false } = params;

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly && { read: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 100),
    });

    return notifications;
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string) {
    const count = await prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });

    return { count };
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenError('You can only mark your own notifications as read');
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return { success: true };
  }
}

export const notificationService = new NotificationService();
export default notificationService;
