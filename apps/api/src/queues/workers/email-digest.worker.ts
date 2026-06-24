import { Job, Worker } from 'bullmq';

import { prisma } from '../../config/database';
import { sendEmail } from '../../services/email.service';
import { bullmqConnection } from '../connection';
import { QUEUE_NAMES } from '../queue-names';

/** Escape HTML entities to prevent XSS in email content. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** 15-minute window for batching unread notifications. */
const DIGEST_WINDOW_MS = 15 * 60 * 1000;

/**
 * Build and send notification-digest emails.
 */
async function processEmailDigest(_job: Job): Promise<void> {
  const cutoff = new Date(Date.now() - DIGEST_WINDOW_MS);

  const unreadNotifications = await prisma.notification.findMany({
    where: {
      read: false,
      createdAt: { gte: cutoff },
      user: { email: { not: null }, status: 'ACTIVE' },
    },
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Group by user
  const byUser = new Map<string, typeof unreadNotifications>();
  for (const notif of unreadNotifications) {
    if (!byUser.has(notif.userId)) {
      byUser.set(notif.userId, []);
    }
    byUser.get(notif.userId)!.push(notif);
  }

  for (const [, notifications] of byUser) {
    const user = notifications[0].user;
    if (!user.email) continue;

    const name = user.name ?? 'there';
    const count = notifications.length;
    const subject = `DeTrust: You have ${count} new notification${count > 1 ? 's' : ''}`;

    const items = notifications
      .slice(0, 5)
      .map(
        (n: { title: string; message: string }) =>
          `<li style="margin-bottom:8px;color:#3f3f46;">${escapeHtml(n.title)}: ${escapeHtml(n.message)}</li>`,
      )
      .join('');

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="margin:0;padding:0;font-family:Inter,Arial,sans-serif;background:#f4f4f5;">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
    <div style="background:#18181b;padding:24px 32px;">
      <h1 style="color:#fff;margin:0;font-size:20px;">🛡️ DeTrust</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#18181b;margin:0 0 16px;">Hi ${escapeHtml(name)}!</h2>
      <p style="color:#3f3f46;line-height:1.6;">You have ${count} new notification${count > 1 ? 's' : ''}:</p>
      <ul style="padding-left:20px;">${items}</ul>
      ${count > 5 ? `<p style="color:#71717a;font-size:14px;">...and ${count - 5} more</p>` : ''}
    </div>
  </div>
</body>
</html>`;

    await sendEmail({ to: user.email, subject, html });
  }

  if (byUser.size > 0) {
    console.log(`[EmailDigestWorker] Sent digest emails to ${byUser.size} user(s)`);
  }
}

export function createEmailDigestWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAMES.EMAIL_DIGEST,
    processEmailDigest,
    {
      connection: bullmqConnection,
      concurrency: 1,
    },
  );

  worker.on('completed', (job) => {
    console.log(`[EmailDigestWorker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[EmailDigestWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
