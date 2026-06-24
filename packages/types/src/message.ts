// Message Types for DeTrust Platform

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  jobId: string | null;
  content: string;
  attachments: string[];
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations (when included)
  sender?: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

export interface Conversation {
  id: string;
  participantId: string;
  participant: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
  lastMessage: Message | null;
  unreadCount: number;
  jobId: string | null;
  job?: {
    id: string;
    title: string;
  };
}

// Send Message
export interface SendMessageInput {
  receiverId: string;
  content: string;
  jobId?: string;
  attachments?: string[];
}

// Socket Events
export enum MessageSocketEvent {
  NEW_MESSAGE = 'message:new',
  MESSAGE_READ = 'message:read',
  TYPING = 'message:typing',
  STOP_TYPING = 'message:stop_typing',
}

export interface TypingEvent {
  conversationId: string;
  userId: string;
}
