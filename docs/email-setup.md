# Email Setup Guide — Google SMTP Configuration

**Updated:** 2026-03-01

---

## Overview

DeTrust uses SMTP for sending email notifications (dispute alerts, message digests, milestone reminders). The recommended provider is **Google SMTP** (Gmail), but any SMTP server works.

---

## Google SMTP Setup

### Step 1: Enable 2-Factor Authentication

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already enabled

### Step 2: Create an App Password

1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select **Mail** as the app
3. Select **Other** as the device and name it "DeTrust"
4. Click **Generate**
5. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

> ⚠️ **Important**: This is NOT your Gmail password. It's a special app-specific password.

### Step 3: Configure Environment Variables

Add the following to your `apps/api/.env` file:

```env
# Email — Google SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
SMTP_FROM=DeTrust <your-email@gmail.com>
```

### Step 4: Verify

Restart the API server. You should see:

```
📧 Email notification job started (every 15 min)
```

If SMTP is not configured, emails fall back to console logging:

```
⚠️  SMTP not configured — emails will be logged to console
📧 [Email] To: user@example.com | Subject: DeTrust: You have 3 new notifications
```

---

## Alternative SMTP Providers

### SendGrid

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=DeTrust <noreply@yourdomain.com>
```

### Mailgun

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@yourdomain.com
SMTP_PASS=your-mailgun-password
SMTP_FROM=DeTrust <noreply@yourdomain.com>
```

### Amazon SES

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-access-key
SMTP_PASS=your-ses-secret-key
SMTP_FROM=DeTrust <noreply@yourdomain.com>
```

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SMTP_HOST` | No* | — | SMTP server hostname |
| `SMTP_PORT` | No | `587` | SMTP port (587 for TLS, 465 for SSL) |
| `SMTP_USER` | No* | — | SMTP username (email address) |
| `SMTP_PASS` | No* | — | SMTP password (app password) |
| `SMTP_FROM` | No | `noreply@detrust.local` | Sender email address |

> *Required only if you want emails to be sent. Without SMTP config, emails are logged to console.

---

## Email Templates

The email service (`apps/api/src/services/email.service.ts`) includes these HTML templates:

| Template | Used For |
|----------|----------|
| `welcome` | New user registration |
| `disputeOpened` | Dispute created on a contract |
| `disputeResolved` | Dispute outcome notification |
| `newMessage` | New message received |
| `milestoneSubmitted` | Milestone submitted for review |

All templates use a consistent design:
- DeTrust branded header (dark background)
- Clean content area with action buttons
- Footer with platform info
- Mobile-responsive layout

---

## Email Digest Job

The background job (`apps/api/src/jobs/email.job.ts`) runs every **15 minutes** and:

1. Finds users with unread notifications created in the last 15 minutes
2. Groups notifications by user
3. Sends an HTML digest email showing up to 5 recent notifications
4. Only sends to users with email addresses and ACTIVE status

To adjust the interval, modify `EMAIL_JOB_INTERVAL_MS` in `email.job.ts`.

---

## Troubleshooting

### "Authentication failed"
- Ensure you're using an **App Password**, not your regular Gmail password
- Verify 2-Factor Authentication is enabled
- Check that `SMTP_USER` matches the Google account that created the App Password

### "Connection refused"
- Check `SMTP_HOST` and `SMTP_PORT` values
- For Gmail: `smtp.gmail.com:587`
- Ensure your firewall/network allows outbound connections on port 587

### "Emails not sending"
- Check server logs for error messages
- Verify all 4 SMTP environment variables are set
- Test with a simple curl command:
  ```bash
  curl --ssl-reqd --url smtp://smtp.gmail.com:587 \
    --user "your-email@gmail.com:your-app-password" \
    --mail-from "your-email@gmail.com" \
    --mail-rcpt "test@example.com" \
    -T /dev/null -v
  ```

### "Emails going to spam"
- Set a proper `SMTP_FROM` address with a display name
- For production, use a custom domain with SPF/DKIM/DMARC records
- Consider using SendGrid/Mailgun/SES for better deliverability
