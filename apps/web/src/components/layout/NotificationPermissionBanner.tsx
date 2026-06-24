'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import {
  getNotificationPermission,
  requestNotificationPermission,
} from '@/lib/service-worker';

/**
 * Dismissible banner that prompts the user to enable browser notifications.
 * Only shown when permission is 'default' (not yet decided).
 * Once dismissed or decided, it hides for the rest of the session.
 */
export function NotificationPermissionBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if the browser supports notifications and user hasn't decided yet
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (getNotificationPermission() !== 'default') return;

    // Small delay so it doesn't flash immediately on page load
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleEnable = useCallback(async () => {
    await requestNotificationPermission();
    setVisible(false);
  }, []);

  const handleDismiss = useCallback(() => {
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="alert"
      className="mx-8 mt-4 flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm"
    >
      <Bell className="h-4 w-4 shrink-0 text-emerald-500" />
      <p className="flex-1 text-dt-text">
        Enable browser notifications to stay updated on messages, milestones, and
        disputes&nbsp;&mdash; even when this tab is in the background.
      </p>
      <button
        type="button"
        onClick={handleEnable}
        className="shrink-0 rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      >
        Enable
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss notification prompt"
        className="shrink-0 rounded-md p-1 text-dt-text-muted hover:text-dt-text focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
