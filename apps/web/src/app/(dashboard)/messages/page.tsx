'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { MessageCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  useConversations,
  useMessages,
  useSendMessage,
  useMarkConversationRead,
  useMessageUnreadCount,
} from '@/hooks/queries/use-messages';
import { useContract } from '@/hooks/queries/use-contracts';
import { useSupportAdmin } from '@/hooks/queries/use-support';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

import { ConversationList } from './components/ConversationList';
import { ChatPanel } from './components/ChatPanel';
import { EmptyState } from './components/EmptyState';

export default function MessagesPage() {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';
  const searchParams = useSearchParams();

  const [selectedPartner, setSelectedPartner] = useState<string>('');
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [contractContext, setContractContext] = useState<string | null>(null);

  // Support admin ID — used to display "Customer Support" label
  const { data: supportAdmin } = useSupportAdmin();
  const adminUserId = supportAdmin?.adminId ?? '';

  // Resolve ?contract= param to auto-select the other party
  const contractParam = searchParams.get('contract');
  const { data: contractData } = useContract(contractParam ?? '');

  useEffect(() => {
    if (!contractData || !userId || selectedPartner) return;
    const otherId =
      contractData.clientId === userId ? contractData.freelancerId : contractData.clientId;
    if (otherId) {
      setSelectedPartner(otherId);
      setContractContext(contractParam);
    }
  }, [contractData, userId, contractParam, selectedPartner]);

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
      ...(contractContext ? { jobId: contractData?.job?.id } : {}),
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
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-dt-text">
          <MessageCircle className="h-6 w-6 text-blue-500" />
          Messages
          {unreadData && unreadData.count > 0 && (
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              {unreadData.count} unread
            </Badge>
          )}
        </h1>
        <p className="mt-1 text-dt-text-muted">
          Chat with clients and freelancers. All messages are archived for dispute evidence.
        </p>
      </div>

      {/* Chat Layout */}
      <Card className="border-dt-border bg-dt-surface">
        <div className="flex h-[calc(100vh-280px)] min-h-[500px]">
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
              onSelectPartner={(id) => {
                setSelectedPartner(id);
                // Clear contract context when manually switching conversations
                if (id !== selectedPartner) setContractContext(null);
              }}
              currentUserId={userId}
              adminUserId={adminUserId}
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
                contractId={contractContext ?? undefined}
                onDismissContract={() => setContractContext(null)}
                adminUserId={adminUserId}
              />
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
