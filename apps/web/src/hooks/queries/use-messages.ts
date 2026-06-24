import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageApi, type SendMessageInput, type AttachmentUploadResult } from '@/lib/api/message';

export const messageKeys = {
  all: ['messages'] as const,
  conversations: (params?: Record<string, unknown>) => [...messageKeys.all, 'conversations', params] as const,
  messages: (partnerId: string, params?: Record<string, unknown>) => [...messageKeys.all, 'thread', partnerId, params] as const,
  unreadCount: () => [...messageKeys.all, 'unreadCount'] as const,
};

export function useConversations(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: messageKeys.conversations(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await messageApi.getConversations(params);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to fetch conversations');
      return res.data;
    },
  });
}

export function useMessages(partnerId: string, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: messageKeys.messages(partnerId, params as Record<string, unknown>),
    queryFn: async () => {
      const res = await messageApi.getMessages(partnerId, params);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to fetch messages');
      return res.data;
    },
    enabled: !!partnerId,
    refetchInterval: 30000, // Fallback poll every 30s (Socket.IO is primary)
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SendMessageInput) => messageApi.sendMessage(input),
    onSuccess: (_, { receiverId }) => {
      qc.invalidateQueries({ queryKey: messageKeys.messages(receiverId) });
      qc.invalidateQueries({ queryKey: messageKeys.conversations() });
      qc.invalidateQueries({ queryKey: messageKeys.unreadCount() });
    },
  });
}

export function useMarkConversationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (partnerId: string) => messageApi.markConversationRead(partnerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messageKeys.conversations() });
      qc.invalidateQueries({ queryKey: messageKeys.unreadCount() });
    },
  });
}

export function useMessageUnreadCount() {
  return useQuery({
    queryKey: messageKeys.unreadCount(),
    queryFn: async () => {
      const res = await messageApi.getUnreadCount();
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to fetch unread count');
      return res.data;
    },
    refetchInterval: 30000, // Poll every 30s
  });
}

export function useUploadAttachment() {
  return useMutation({
    mutationFn: async (file: File) => {
      const res = await messageApi.uploadAttachment(file);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Upload failed');
      return res.data as AttachmentUploadResult;
    },
  });
}
