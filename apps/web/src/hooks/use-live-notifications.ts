'use client';

import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { messageKeys } from './queries/use-messages';
import { registerServiceWorker, showPushNotification } from '@/lib/service-worker';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function useLiveNotifications(userId: string | undefined) {
  const queryClient = useQueryClient();

  // Register service worker on mount
  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    let socketBaseUrl = 'http://localhost:4000';

    try {
      const parsed = new URL(apiUrl);
      socketBaseUrl = `${parsed.protocol}//${parsed.host}`;
    } catch {
      socketBaseUrl = apiUrl.replace(/\/api\/?$/, '');
    }

    socket = io(socketBaseUrl, {
      path: '/ws',
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    // ── Notification events ────────────────────────────────────────
    socket.on('notification:new', (notification: { title?: string; message?: string }) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      // Show browser notification when tab is not focused
      if (!document.hasFocus() && notification.title) {
        showPushNotification(
          notification.title,
          notification.message ?? '',
          '/dashboard',
          'detrust-notification',
        );
      }
    });

    // ── Message events (real-time) ─────────────────────────────────
    socket.on('message:new', (msg: { senderId?: string; sender?: { name?: string } }) => {
      // Invalidate the thread with the sender, and the conversation list + unread count
      if (msg.senderId) {
        queryClient.invalidateQueries({ queryKey: messageKeys.messages(msg.senderId) });
      }
      queryClient.invalidateQueries({ queryKey: messageKeys.conversations() });
      queryClient.invalidateQueries({ queryKey: messageKeys.unreadCount() });

      // Show browser notification when tab is not focused
      if (!document.hasFocus()) {
        const senderName = msg.sender?.name ?? 'Someone';
        showPushNotification(
          `New message from ${senderName}`,
          'You have a new message on DeTrust',
          '/messages',
          'detrust-message',
        );
      }
    });

    socket.on('message:read', () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.conversations() });
      queryClient.invalidateQueries({ queryKey: messageKeys.unreadCount() });
    });

    // ── Contract status events ─────────────────────────────────────
    socket.on('contract:status', (data: { contractId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['contracts', 'detail', data.contractId] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    });

    // ── Trust score live updates (M4) ──────────────────────────────
    socket.on('trust-score:updated', (data: { userId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['trustScore', data.userId] });
      queryClient.invalidateQueries({ queryKey: ['trustScore', 'history', data.userId] });
    });

    socket.on('connect_error', (err) => {
      console.warn('[ws] connection error:', err.message);
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [userId, queryClient]);
}
