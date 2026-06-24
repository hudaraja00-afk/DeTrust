'use client';

import { useEffect, useRef, useState } from 'react';
import { Headset, Send, X, Minus } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useSupportAdmin } from '@/hooks/queries/use-support';
import { useMessages, useSendMessage, useMarkConversationRead } from '@/hooks/queries/use-messages';
import { MessageBubble } from '@/app/(dashboard)/messages/components/MessageBubble';

export function SupportWidget() {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';

  const [isOpen, setIsOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: supportAdmin, isLoading: loadingAdmin } = useSupportAdmin();
  const adminId = supportAdmin?.adminId ?? '';

  const { data: messagesData, isLoading: loadingMessages } = useMessages(
    isOpen ? adminId : '' // Only fetch when open + admin resolved
  );
  const sendMutation = useSendMessage();
  const markReadMutation = useMarkConversationRead();

  const messages = messagesData?.items ?? [];
  const isAdmin = user?.role === 'ADMIN';

  // Auto-scroll when messages change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Mark as read when opened
  useEffect(() => {
    if (isOpen && adminId) {
      markReadMutation.mutate(adminId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, adminId]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!messageText.trim() || !adminId) return;
    const res = await sendMutation.mutateAsync({
      receiverId: adminId,
      content: messageText.trim(),
    });
    if (res.success) {
      setMessageText('');
    } else {
      toast.error(res.error?.message ?? 'Failed to send message');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Don't show widget for admin users (they ARE the support team)
  if (isAdmin) return null;

  return (
    <>
      {/* Floating chat panel */}
      {isOpen && (
        <div
          className="fixed bottom-20 right-6 z-50 flex h-[460px] w-[360px] flex-col overflow-hidden rounded-2xl border border-dt-border bg-white shadow-2xl dark:bg-slate-900 sm:right-6"
          role="dialog"
          aria-label="Customer Support Chat"
        >
          {/* Header */}
          <div className="flex items-center gap-3 bg-emerald-600 px-4 py-3 text-white dark:bg-emerald-700">
            <Headset className="h-5 w-5" />
            <div className="flex-1">
              <p className="text-sm font-semibold">Customer Support</p>
              <p className="text-[11px] opacity-80">
                {supportAdmin?.adminName ?? 'DeTrust Team'}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 transition hover:bg-white/20"
              aria-label="Minimize support chat"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 transition hover:bg-white/20"
              aria-label="Close support chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3">
            {loadingAdmin || loadingMessages ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="md" />
              </div>
            ) : !adminId ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-dt-text-muted">
                <Headset className="mb-2 h-8 w-8 opacity-40" />
                <p>Support is currently unavailable.</p>
                <p className="mt-1 text-xs">Please try again later.</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-dt-text-muted">
                <Headset className="mb-3 h-10 w-10 text-emerald-400 opacity-60" />
                <p className="font-medium text-dt-text">Need help?</p>
                <p className="mt-1 text-xs">
                  Send us a message and we&apos;ll get back to you as soon as possible.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwn={msg.senderId === userId}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          {adminId && (
            <div className="border-t border-dt-border p-3">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="flex-1 border-dt-border text-sm"
                  aria-label="Support message input"
                />
                <Button
                  onClick={handleSend}
                  disabled={!messageText.trim() || sendMutation.isPending}
                  size="sm"
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                  aria-label="Send support message"
                >
                  {sendMutation.isPending ? (
                    <Spinner size="sm" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating action button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900',
          isOpen
            ? 'bg-slate-600 text-white hover:bg-slate-700 dark:bg-slate-700'
            : 'bg-emerald-600 text-white hover:bg-emerald-700'
        )}
        aria-label={isOpen ? 'Close support chat' : 'Open customer support'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Headset className="h-6 w-6" />
        )}
      </button>
    </>
  );
}
