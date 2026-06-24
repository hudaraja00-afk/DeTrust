import { Router } from 'express';
import { authenticate } from '../middleware';
import { notificationController } from '../controllers/notification.controller';

const router: Router = Router();

// =============================================================================
// NOTIFICATION ROUTES
// =============================================================================

// List notifications for the authenticated user
router.get('/', authenticate, notificationController.getNotifications);

// Get unread notification count
router.get('/unread-count', authenticate, notificationController.getUnreadCount);

// Mark a single notification as read
router.patch('/:id/read', authenticate, notificationController.markAsRead);

// Mark all notifications as read
router.patch('/read-all', authenticate, notificationController.markAllAsRead);

export default router;
