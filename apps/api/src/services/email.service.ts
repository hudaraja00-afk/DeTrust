import nodemailer from 'nodemailer';
import { config } from '../config';

/**
 * Email service using Google SMTP (or any SMTP provider).
 * Gracefully degrades when SMTP is not configured.
 */

/** Escape user-controlled values before embedding in HTML templates. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  if (!config.email.host || !config.email.user || !config.email.pass) {
    console.warn('⚠️  SMTP not configured — emails will be logged to console');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });

  return transporter;
}

// =============================================================================
// EMAIL TEMPLATES
// =============================================================================

function baseTemplate(title: string, body: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;font-family:Inter,Arial,sans-serif;background:#f4f4f5;">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
    <div style="background:#18181b;padding:24px 32px;">
      <h1 style="color:#fff;margin:0;font-size:20px;">🛡️ DeTrust</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#18181b;margin:0 0 16px;">${title}</h2>
      ${body}
    </div>
    <div style="padding:16px 32px;background:#f4f4f5;text-align:center;font-size:12px;color:#71717a;">
      <p style="margin:0;">DeTrust — Decentralized Freelance Marketplace</p>
      <p style="margin:4px 0 0;">This is an automated notification. Do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;
}

export const emailTemplates = {
  disputeOpened: (contractTitle: string, reason: string) =>
    baseTemplate(
      'Dispute Opened',
      `<p style="color:#3f3f46;line-height:1.6;">A dispute has been raised on contract <strong>"${escapeHtml(contractTitle)}"</strong>.</p>
       <p style="color:#3f3f46;"><strong>Reason:</strong> ${escapeHtml(reason)}</p>
       <p style="color:#3f3f46;">Please review the dispute details and submit any evidence within the allowed time frame.</p>
       <a href="${config.server.frontendUrl}/dashboard/disputes" style="display:inline-block;padding:12px 24px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:8px;margin-top:16px;">View Dispute</a>`,
    ),

  disputeResolved: (contractTitle: string, outcome: string) =>
    baseTemplate(
      'Dispute Resolved',
      `<p style="color:#3f3f46;line-height:1.6;">The dispute on contract <strong>"${escapeHtml(contractTitle)}"</strong> has been resolved.</p>
       <p style="color:#3f3f46;"><strong>Outcome:</strong> ${escapeHtml(outcome)}</p>
       <a href="${config.server.frontendUrl}/dashboard/disputes" style="display:inline-block;padding:12px 24px;background:#22c55e;color:#fff;text-decoration:none;border-radius:8px;margin-top:16px;">View Details</a>`,
    ),

  newMessage: (senderName: string) =>
    baseTemplate(
      'New Message',
      `<p style="color:#3f3f46;line-height:1.6;">You have received a new message from <strong>${escapeHtml(senderName)}</strong>.</p>
       <a href="${config.server.frontendUrl}/dashboard/messages" style="display:inline-block;padding:12px 24px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:8px;margin-top:16px;">View Messages</a>`,
    ),

  milestoneSubmitted: (contractTitle: string, milestoneTitle: string) =>
    baseTemplate(
      'Milestone Submitted',
      `<p style="color:#3f3f46;line-height:1.6;">A milestone has been submitted for review on <strong>"${escapeHtml(contractTitle)}"</strong>.</p>
       <p style="color:#3f3f46;"><strong>Milestone:</strong> ${escapeHtml(milestoneTitle)}</p>
       <p style="color:#3f3f46;">You have 7 days to review and approve. If no action is taken, the milestone will be auto-approved.</p>
       <a href="${config.server.frontendUrl}/dashboard/contracts" style="display:inline-block;padding:12px 24px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:8px;margin-top:16px;">Review Milestone</a>`,
    ),

  welcome: (name: string) =>
    baseTemplate(
      'Welcome to DeTrust!',
      `<p style="color:#3f3f46;line-height:1.6;">Hi <strong>${escapeHtml(name)}</strong>,</p>
       <p style="color:#3f3f46;line-height:1.6;">Welcome to DeTrust — the decentralized freelance marketplace with trustless payments, transparent reputation, and fair dispute resolution.</p>
       <a href="${config.server.frontendUrl}/dashboard" style="display:inline-block;padding:12px 24px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:8px;margin-top:16px;">Go to Dashboard</a>`,
    ),

  passwordReset: (resetToken: string) =>
    baseTemplate(
      'Reset Your Password',
      `<p style="color:#3f3f46;line-height:1.6;">We received a request to reset your password. Click the button below to choose a new one.</p>
       <a href="${config.server.frontendUrl}/forgot-password?token=${encodeURIComponent(resetToken)}" style="display:inline-block;padding:12px 24px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:8px;margin-top:16px;">Reset Password</a>
       <p style="color:#71717a;font-size:13px;margin-top:24px;">This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>`,
    ),
};

// =============================================================================
// SEND EMAIL
// =============================================================================

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const { to, subject, html } = params;

  const smtp = getTransporter();

  if (!smtp) {
    // Fallback: log to console in dev
    console.log(`📧 [Email] To: ${to} | Subject: ${subject}`);
    return true;
  }

  try {
    await smtp.sendMail({
      from: config.email.from,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return false;
  }
}

export default { sendEmail, emailTemplates };
