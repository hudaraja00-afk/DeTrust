import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware';
import { notificationService } from '../services/notification.service';

/**
 * Get notifications for the authenticated user
 * GET /api/notifications
 */
export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const { limit = '50', unreadOnly } = req.query;

    const params = {
      limit: Math.min(parseInt(limit as string, 10), 100),
      unreadOnly: unreadOnly === 'true',
    };

    const notifications = await notificationService.getNotifications(userId, params);

    res.json({
      success: true,
      data: {
        items: notifications,
        total: notifications.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 */
export const getUnreadCount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;

    const data = await notificationService.getUnreadCount(userId);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a single notification as read
 * PATCH /api/notifications/:id/read
 */
export const markAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const { id } = req.params;

    const notification = await notificationService.markAsRead(id, userId);

    res.json({
      success: true,
      data: notification,
      message: 'Notification marked as read',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read
 * PATCH /api/notifications/read-all
 */
export const markAllAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;

    const result = await notificationService.markAllAsRead(userId);

    res.json({
      success: true,
      data: result,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};

export const notificationController = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
