'use client';

import { Search, MessageCircle, Headset } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import type { Conversation } from '@detrust/types';

interface ConversationListProps {
  conversations: Conversation[];
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedPartnerId: string;
  onSelectPartner: (partnerId: string) => void;
  currentUserId: string;
  /** Support admin user ID — used to show "Customer Support" label */
  adminUserId?: string;
}

export function ConversationList({
  conversations,
  isLoading,
  searchTerm,
  onSearchChange,
  selectedPartnerId,
  onSelectPartner,
  currentUserId,
  adminUserId,
}: ConversationListProps) {
  const getDisplayName = (conv: Conversation) =>
    adminUserId && conv.participantId === adminUserId
      ? 'Customer Support'
      : (conv.participant?.name ?? 'Unknown User');

  const filtered = searchTerm
    ? conversations.filter((c) =>
        getDisplayName(c).toLowerCase().includes(searchTerm.toLowerCase())
      )
    : conversations;

  return (
    <>
      {/* Search */}
      <div className="border-b border-dt-border p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dt-text-muted" />
          <Input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            className="border-dt-border pl-9"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Spinner size="md" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-dt-text-muted">
            <MessageCircle className="mx-auto mb-2 h-8 w-8 opacity-40" />
            <p>No conversations yet</p>
          </div>
        ) : (
          filtered.map((conv) => (
            <button
              key={conv.participantId}
              onClick={() => onSelectPartner(conv.participantId)}
              className={cn(
                'flex w-full items-start gap-3 border-b border-dt-border p-3 text-left transition hover:bg-dt-surface-alt',
                selectedPartnerId === conv.participantId && 'bg-dt-surface-alt'
              )}
            >
              {adminUserId && conv.participantId === adminUserId ? (
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                  <Headset className="h-5 w-5" />
                </div>
              ) : (
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  {conv.participant?.name?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm font-medium text-dt-text">
                    {getDisplayName(conv)}
                  </p>
                  {conv.unreadCount > 0 && (
                    <Badge className="ml-2 bg-blue-500 text-xs text-white">
                      {conv.unreadCount}
                    </Badge>
                  )}
                </div>
                {conv.lastMessage && (
                  <p className="mt-0.5 truncate text-xs text-dt-text-muted">
                    {conv.lastMessage.senderId === currentUserId ? 'You: ' : ''}
                    {conv.lastMessage.content}
                  </p>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </>
  );
}
