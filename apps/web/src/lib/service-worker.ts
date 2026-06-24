/**
 * Service worker registration and push notification utilities.
 * Used by the live notifications hook to show browser notifications
 * when the tab is backgrounded.
 */

let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Register the service worker. Should be called once on app load.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined') return null;
  if (!('serviceWorker' in navigator)) {
    console.warn('[SW] Service workers not supported');
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    swRegistration = reg;
    console.log('[SW] Registered:', reg.scope);
    return reg;
  } catch (err) {
    console.error('[SW] Registration failed:', err);
    return null;
  }
}

/**
 * Request notification permission from the user.
 * Returns 'granted', 'denied', or 'default'.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined') return 'default';
  if (!('Notification' in window)) return 'default';

  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';

  return Notification.requestPermission();
}

/**
 * Get the current notification permission state.
 */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined') return 'default';
  if (!('Notification' in window)) return 'default';
  return Notification.permission;
}

/**
 * Show a notification via the service worker.
 * Falls back to the native Notification API if SW is unavailable.
 */
export async function showPushNotification(
  title: string,
  body: string,
  url?: string,
  tag?: string,
): Promise<void> {
  if (typeof window === 'undefined') return;
  if (Notification.permission !== 'granted') return;

  // Try SW message approach first
  const reg = swRegistration || (await navigator.serviceWorker?.ready);
  if (reg?.active) {
    reg.active.postMessage({
      type: 'SHOW_NOTIFICATION',
      title,
      body,
      url: url ?? '/',
      tag: tag ?? 'detrust-notification',
    });
    return;
  }

  // Fallback: native Notification API
  try {
    new Notification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      tag: tag ?? 'detrust-notification',
    });
  } catch {
    // Silently fail on contexts that don't support Notification constructor
  }
}
