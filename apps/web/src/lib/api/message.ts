import { api } from './client';
import type { Message, Conversation } from '@detrust/types';

// =============================================================================
// MESSAGE TYPES
// =============================================================================

export type { Message, Conversation };

export interface SendMessageInput {
  receiverId: string;
  content: string;
  jobId?: string;
  attachments?: string[];
}

export interface AttachmentUploadResult {
  url: string;
  fileId: string;
  mimeType: string;
  size: number;
  filename: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface UnreadCountResponse {
  count: number;
}

// =============================================================================
// MESSAGE API
// =============================================================================

export const messageApi = {
  // Get conversations
  getConversations: (params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return api.get<PaginatedResponse<Conversation>>(`/messages/conversations${query ? `?${query}` : ''}`);
  },

  // Get messages with a partner
  getMessages: (partnerId: string, params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return api.get<PaginatedResponse<Message>>(`/messages/${partnerId}${query ? `?${query}` : ''}`);
  },

  // Send a message
  sendMessage: (input: SendMessageInput) =>
    api.post<Message>('/messages', input),

  // Mark conversation as read
  markConversationRead: (partnerId: string) =>
    api.patch<{ success: boolean }>(`/messages/${partnerId}/read`),

  // Get unread count
  getUnreadCount: () =>
    api.get<UnreadCountResponse>('/messages/unread-count'),

  // Upload a file attachment (returns URL to include in attachments[])
  uploadAttachment: (file: File) => {
    const formData = new FormData();
    formData.append('document', file);
    return api.post<AttachmentUploadResult>('/messages/upload-attachment', formData);
  },
};

export default messageApi;
