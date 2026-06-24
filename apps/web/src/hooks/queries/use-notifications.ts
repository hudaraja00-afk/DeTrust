import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi, type GetNotificationsParams } from '@/lib/api/notification';

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (params?: GetNotificationsParams) => [...notificationKeys.lists(), params] as const,
  unreadCount: () => [...notificationKeys.all, 'unreadCount'] as const,
};

export function useNotifications(params?: GetNotificationsParams) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: async () => {
      const res = await notificationApi.getNotifications(params);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to fetch notifications');

      if (Array.isArray(res.data)) {
        return {
          items: res.data,
          total: res.data.length,
        };
      }

      return res.data;
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async () => {
      const res = await notificationApi.getUnreadCount();
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to fetch unread count');
      return res.data;
    },
    refetchInterval: 30000,
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
