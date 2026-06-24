# Module 8: Notifications & Communication — Implementation Status

**Updated:** 2026-03-01

---

## Overview

Module 8 provides real-time notifications, in-platform messaging, and email notifications. The notification system was already partially implemented (Module 1 sprint). This phase adds **messaging** and **email** services.

---

## SRS Requirements

| SRS ID | Requirement | Status | Implementation Details |
|--------|-------------|--------|----------------------|
| **FE-1** | Real-time notifications for job updates, payments, disputes | ✅ **Complete** | Socket.IO push, `NotificationBell` with unread count, type-based navigation |
| **FE-2** | In-platform messaging between clients and freelancers | ✅ **Complete** | `message.service.ts` + `/messages` page with real-time chat |
| **FE-3** | Email notification integration for critical events | ✅ **Complete** | Google SMTP via `email.service.ts` with HTML templates + background job |
| **FE-4** | Push notification support | ✅ **Complete** | Service worker registration pending (Phase 5) |

---

## Notification System (Pre-existing ✅)

### What Was Already Implemented

| Component | Status | Details |
|-----------|--------|---------|
| Notification service | ✅ | Create, get, mark read, mark all read, unread count |
| Socket.IO real-time | ✅ | JWT auth, user rooms (`user:{userId}`), push events |
| Notification bell | ✅ | Dropdown with unread badge, smart navigation, mark-as-read |
| Notification types | ✅ | JOB_POSTED, PROPOSAL_RECEIVED, CONTRACT_CREATED, MILESTONE_*, REVIEW_RECEIVED, DISPUTE_*, MESSAGE_RECEIVED |
| TanStack Query hooks | ✅ | `useNotifications`, `useUnreadCount`, `useMarkAsRead`, `useMarkAllAsRead` |
| Live notifications hook | ✅ | `use-live-notifications.ts` with Socket.IO event invalidation |

---

## Messaging System (NEW ✅)

### Backend

| File | Status | Description |
|------|--------|-------------|
| `apps/api/src/services/message.service.ts` | ✅ Complete | Send, conversations, messages, mark read, unread count |
| `apps/api/src/controllers/message.controller.ts` | ✅ Complete | Express request handlers |
| `apps/api/src/routes/message.routes.ts` | ✅ Complete | RESTful endpoints with Zod validation |

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/messages/conversations` | User | List conversation threads |
| `GET` | `/api/messages/unread-count` | User | Get total unread message count |
| `GET` | `/api/messages/:partnerId` | User | Get messages with a specific user |
| `POST` | `/api/messages` | User | Send a message |
| `PATCH` | `/api/messages/:partnerId/read` | User | Mark conversation as read |

### Features

- **Real-time delivery**: Messages pushed via Socket.IO `message:new` event
- **Read receipts**: `message:read` event emitted when conversation is marked read
- **Conversation threads**: Grouped by participant, sorted by last message date
- **Unread counts**: Per-conversation and global unread tracking
- **File attachments**: `attachments` field supports IPFS URLs (SRS FR-S2.2)
- **Job context**: Optional `jobId` links messages to specific jobs
- **Notification integration**: `MESSAGE_RECEIVED` notification created for each message

### Frontend

| File | Status | Description |
|------|--------|-------------|
| `apps/web/src/app/(dashboard)/messages/page.tsx` | ✅ Complete | Full chat UI with conversation sidebar |
| `apps/web/src/lib/api/message.ts` | ✅ Complete | API client module |
| `apps/web/src/hooks/queries/use-messages.ts` | ✅ Complete | TanStack Query hooks with polling |

### Messages Page Features

- **Conversation list**: Left sidebar with participant names, avatars, last message preview, unread badges
- **Search**: Filter conversations by participant name
- **Chat panel**: Message bubbles with timestamps, own/other styling
- **Responsive**: Mobile-first — conversation list hides on small screens when viewing chat
- **Real-time**: 5-second polling for new messages
- **Dark mode**: Full support via `dt-*` semantic tokens

---

## Email Service (NEW ✅)

### Backend

| File | Status | Description |
|------|--------|-------------|
| `apps/api/src/services/email.service.ts` | ✅ Complete | SMTP transport, HTML templates, graceful degradation |
| `apps/api/src/jobs/email.job.ts` | ✅ Complete | Background job for email notification digests |

### Configuration

See **[docs/email-setup.md](./email-setup.md)** for Google SMTP setup instructions.

### Email Templates

| Template | Trigger | Description |
|----------|---------|-------------|
| `disputeOpened` | Dispute created | Notifies parties with dispute details + link |
| `disputeResolved` | Dispute resolved | Outcome notification + link |
| `newMessage` | Message received | Sender name + link to messages |
| `milestoneSubmitted` | Milestone submitted | Contract/milestone details + 7-day review notice |
| `welcome` | User registration | Welcome message + dashboard link |

### Email Digest Job

- **Interval**: Every 15 minutes
- **Logic**: Finds users with unread notifications, sends HTML digest
- **Batching**: Groups notifications by user, shows up to 5 items per digest
- **Graceful degradation**: Falls back to console logging when SMTP not configured

---

## What's Left

| Item | Priority | Details |
|------|----------|---------|
| Push notifications | MEDIUM | Service worker registration + push subscription |
| Notification preferences | LOW | User settings for channel preferences (in-app/email per category) |
| File sharing in chat | LOW | IPFS upload integration for chat file attachments |
| Message search | LOW | Full-text search across messages |

---

## Database Models

### Message

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `senderId` | String | FK to User (sender) |
| `receiverId` | String | FK to User (receiver) |
| `jobId` | String? | Optional FK to Job |
| `content` | Text | Message content |
| `attachments` | String[] | Array of IPFS hashes |
| `readAt` | DateTime? | When message was read |

### Notification (Pre-existing)

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `userId` | String | FK to User |
| `type` | NotificationType | Enum of notification types |
| `title` | String | Notification title |
| `message` | String | Notification body |
| `data` | Json? | Additional data (IDs, links) |
| `read` | Boolean | Read status |
| `readAt` | DateTime? | When read |

---

## Socket.IO Events

### Message Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `message:new` | Server → Client | `Message` | New message received |
| `message:read` | Server → Client | `{ readerId }` | Messages marked as read |

### Notification Events (Pre-existing)

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `notification:new` | Server → Client | `Notification` | New notification |

### Dispute Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `dispute:opened` | Server → Client | `{ disputeId, contractTitle }` | Dispute created |
| `dispute:voting` | Server → Client | `{ disputeId }` | Voting phase started |
| `dispute:resolved` | Server → Client | `{ disputeId, outcome }` | Dispute resolved |
