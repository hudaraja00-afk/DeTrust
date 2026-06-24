'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { MessageCircle, TrendingUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import {
  useConversations,
  useMessages,
  useSendMessage,
  useMarkConversationRead,
  useMessageUnreadCount,
} from '@/hooks/queries/use-messages';
import { useAdminStats } from '@/hooks/queries/use-admin';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

import { ConversationList } from '../../messages/components/ConversationList';
import { ChatPanel } from '../../messages/components/ChatPanel';
import { EmptyState } from '../../messages/components/EmptyState';

export default function AdminMessagesPage() {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';

  const [selectedPartner, setSelectedPartner] = useState<string>('');
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: stats, isLoading: loadingStats } = useAdminStats();
  const { data: conversationsData, isLoading: loadingConversations } = useConversations();
  const { data: messagesData, isLoading: loadingMessages } = useMessages(selectedPartner);
  const { data: unreadData } = useMessageUnreadCount();
  const sendMutation = useSendMessage();
  const markReadMutation = useMarkConversationRead();

  const conversations = conversationsData?.items ?? [];
  const messages = messagesData?.items ?? [];

  // Mark conversation as read when opened
  useEffect(() => {
    if (selectedPartner) {
      markReadMutation.mutate(selectedPartner);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPartner]);

  const handleSendMessage = async (attachmentUrls?: string[]) => {
    if (!messageText.trim() && !attachmentUrls?.length) return;
    if (!selectedPartner) return;

    const res = await sendMutation.mutateAsync({
      receiverId: selectedPartner,
      content: messageText.trim() || (attachmentUrls?.length ? '📎 Attachment' : ''),
      ...(attachmentUrls?.length ? { attachments: attachmentUrls } : {}),
    });

    if (res.success) {
      setMessageText('');
    } else {
      toast.error(res.error?.message ?? 'Failed to send message');
    }
  };

  const selectedConversation = conversations.find(
    (c: { participantId: string }) => c.participantId === selectedPartner
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-dt-text">
          <MessageCircle className="h-6 w-6 text-rose-500" />
          Support Messages
          {unreadData && unreadData.count > 0 && (
            <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
              {unreadData.count} unread
            </Badge>
          )}
        </h1>
        <p className="mt-1 text-sm text-dt-text-muted">
          Respond to user support messages. All conversations are archived for dispute evidence.
        </p>
      </div>

      {/* Stats row */}
      {!loadingStats && stats && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="border-dt-border bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/30 dark:to-rose-900/20">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500 text-white">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-rose-700 dark:text-rose-400">Total Messages</p>
                <p className="text-lg font-bold text-rose-800 dark:text-rose-300">{stats.messages.total.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-dt-border bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-blue-700 dark:text-blue-400">This Month</p>
                <p className="text-lg font-bold text-blue-800 dark:text-blue-300">{stats.messages.thisMonth.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chat Layout */}
      <Card className="border-dt-border bg-dt-surface">
        <div className="flex h-[calc(100vh-380px)] min-h-[450px]">
          {/* Conversation List */}
          <div
            className={cn(
              'w-full border-r border-dt-border sm:w-80 sm:flex-shrink-0',
              selectedPartner && 'hidden sm:block'
            )}
          >
            <ConversationList
              conversations={conversations}
              isLoading={loadingConversations}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedPartnerId={selectedPartner}
              onSelectPartner={(id) => setSelectedPartner(id)}
              currentUserId={userId}
            />
          </div>

          {/* Chat Panel */}
          <div className={cn('flex flex-1 flex-col', !selectedPartner && 'hidden sm:flex')}>
            {!selectedPartner ? (
              <EmptyState />
            ) : (
              <ChatPanel
                conversation={selectedConversation}
                messages={messages}
                isLoading={loadingMessages}
                currentUserId={userId}
                messageText={messageText}
                onMessageTextChange={setMessageText}
                onSendMessage={handleSendMessage}
                isSending={sendMutation.isPending}
                onBack={() => setSelectedPartner('')}
              />
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
