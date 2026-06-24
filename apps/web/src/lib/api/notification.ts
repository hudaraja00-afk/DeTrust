import { api } from './client';
import type { Notification } from '@detrust/types';

// =============================================================================
// NOTIFICATION TYPES
// =============================================================================

export type { Notification };

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  read?: boolean;
}

interface NotificationsResponse {
  items: Notification[];
  total: number;
}

interface UnreadCountResponse {
  count: number;
}

// =============================================================================
// NOTIFICATION API
// =============================================================================

export const notificationApi = {
  // List notifications
  getNotifications: (params?: GetNotificationsParams) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return api.get<NotificationsResponse>(`/notifications${query ? `?${query}` : ''}`);
  },

  // Get unread count
  getUnreadCount: () =>
    api.get<UnreadCountResponse>('/notifications/unread-count'),

  // Mark a single notification as read
  markAsRead: (id: string) =>
    api.patch<Notification>(`/notifications/${id}/read`),

  // Mark all notifications as read
  markAllAsRead: () =>
    api.patch<void>('/notifications/read-all'),
};

export default notificationApi;
