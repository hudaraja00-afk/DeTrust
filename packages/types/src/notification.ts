// Notification Types for DeTrust Platform

export enum NotificationType {
  JOB_POSTED = 'JOB_POSTED',
  PROPOSAL_RECEIVED = 'PROPOSAL_RECEIVED',
  PROPOSAL_ACCEPTED = 'PROPOSAL_ACCEPTED',
  PROPOSAL_REJECTED = 'PROPOSAL_REJECTED',
  CONTRACT_CREATED = 'CONTRACT_CREATED',
  MILESTONE_SUBMITTED = 'MILESTONE_SUBMITTED',
  MILESTONE_APPROVED = 'MILESTONE_APPROVED',
  MILESTONE_AUTO_APPROVED = 'MILESTONE_AUTO_APPROVED',
  PAYMENT_RELEASED = 'PAYMENT_RELEASED',
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
  DISPUTE_OPENED = 'DISPUTE_OPENED',
  DISPUTE_VOTING = 'DISPUTE_VOTING',
  DISPUTE_RESOLVED = 'DISPUTE_RESOLVED',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  SYSTEM = 'SYSTEM',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  read: boolean;
  readAt: Date | null;
  createdAt: Date;
}

// Notification Preferences
export interface NotificationPreferences {
  email: {
    proposals: boolean;
    messages: boolean;
    milestones: boolean;
    payments: boolean;
    disputes: boolean;
    marketing: boolean;
  };
  push: {
    proposals: boolean;
    messages: boolean;
    milestones: boolean;
    payments: boolean;
    disputes: boolean;
  };
}

// Socket Events
export enum NotificationSocketEvent {
  NEW_NOTIFICATION = 'notification:new',
  NOTIFICATION_READ = 'notification:read',
  NOTIFICATIONS_READ_ALL = 'notification:read_all',
}
