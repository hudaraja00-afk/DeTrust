import { Job, Worker } from 'bullmq';

import { sendEmail } from '../../services/email.service';
import { bullmqConnection } from '../connection';
import { QUEUE_NAMES } from '../queue-names';

export interface EmailSendData {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send a single email with automatic BullMQ retry on SMTP failure.
 */
async function processEmailSend(job: Job<EmailSendData>): Promise<void> {
  const { to, subject, html } = job.data;
  await sendEmail({ to, subject, html });
  console.log(`[EmailSendWorker] Sent email to ${to}: "${subject}"`);
}

export function createEmailSendWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAMES.EMAIL_SEND,
    processEmailSend,
    {
      connection: bullmqConnection,
      concurrency: 5, // Parallel SMTP sends
      limiter: { max: 30, duration: 60_000 }, // Rate limit: 30 emails/min
    },
  );

  worker.on('completed', (job) => {
    console.log(`[EmailSendWorker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[EmailSendWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
