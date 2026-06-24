'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, CheckCheck, Inbox } from 'lucide-react';
import { NotificationType } from '@detrust/types';

import { cn, formatRelativeTime } from '@/lib/utils';
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from '@/hooks/queries/use-notifications';
import { useAuthStore } from '@/store/auth.store';

/** Map notification types to the page the user should land on. */
function getNotificationHref(type: NotificationType, data: Record<string, unknown> | null, isAdmin: boolean): string | null {
  if (!data) return null;

  const prefix = isAdmin ? '/admin' : '';

  switch (type) {
    case NotificationType.JOB_POSTED:
      return data.jobId ? `${prefix}/jobs/${data.jobId}` : null;
    case NotificationType.PROPOSAL_RECEIVED:
    case NotificationType.PROPOSAL_ACCEPTED:
    case NotificationType.PROPOSAL_REJECTED:
      return data.proposalId ? `${prefix}/proposals` : data.jobId ? `${prefix}/jobs/${data.jobId}/proposals` : null;
    case NotificationType.CONTRACT_CREATED:
    case NotificationType.MILESTONE_SUBMITTED:
    case NotificationType.MILESTONE_APPROVED:
    case NotificationType.MILESTONE_AUTO_APPROVED:
    case NotificationType.PAYMENT_RELEASED:
      return data.contractId ? `${prefix}/contracts/${data.contractId}` : null;
    case NotificationType.DISPUTE_OPENED:
    case NotificationType.DISPUTE_VOTING:
    case NotificationType.DISPUTE_RESOLVED:
      return data.contractId ? `${prefix}/contracts/${data.contractId}` : null;
    case NotificationType.REVIEW_RECEIVED:
      return `${prefix}/profile`;
    case NotificationType.MESSAGE_RECEIVED:
      return `${prefix}/messages`;
    default:
      return null;
  }
}

export function NotificationBell() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const bellButtonRef = useRef<HTMLButtonElement>(null);

  const { data: unreadData } = useUnreadCount();
  const { data: notificationsData, isLoading } = useNotifications({ limit: 10 });
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const unreadCount = unreadData?.count ?? 0;
  const notifications = notificationsData?.items ?? [];

  // Close dropdown on outside click
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, handleClickOutside]);

  // Close dropdown on Escape and return focus to bell button
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        bellButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleNotificationClick = (notification: { id: string; type: NotificationType; read: boolean; data: Record<string, unknown> | null }) => {
    if (!notification.read) {
      markAsRead.mutate(notification.id);
    }

    const href = getNotificationHref(notification.type, notification.data, isAdmin);
    if (href) {
      router.push(href);
    }

    setOpen(false);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Bell button */}
      <button
        ref={bellButtonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-full border border-slate-200 p-3 text-slate-500 transition-all hover:border-emerald-200 hover:text-emerald-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-emerald-800 dark:hover:text-emerald-400"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-[380px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsRead.isPending}
                className="flex items-center gap-1 text-xs font-medium text-emerald-600 transition-colors hover:text-emerald-700 disabled:opacity-50 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-500">
                <Inbox className="mb-2 h-8 w-8" />
                <p className="text-sm font-medium">No notifications yet</p>
                <p className="text-xs">We&apos;ll let you know when something arrives</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  role="menuitem"
                  tabIndex={0}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60',
                    !notification.read && 'bg-emerald-50/50 dark:bg-emerald-950/20'
                  )}
                >
                  {/* Unread indicator */}
                  <div className="mt-1.5 flex-shrink-0">
                    {notification.read ? (
                      <Check className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                    ) : (
                      <span className="block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      'truncate text-sm',
                      notification.read
                        ? 'text-slate-600 dark:text-slate-400'
                        : 'font-semibold text-slate-900 dark:text-slate-100'
                    )}>
                      {notification.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
