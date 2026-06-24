'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowLeft, Send, Headset, Paperclip, X, FileText, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import type { Conversation, Message } from '@detrust/types';
import { useUploadAttachment } from '@/hooks/queries/use-messages';
import { MessageBubble } from './MessageBubble';
import { ContractContextBanner } from './ContractContextBanner';

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB per file

interface PendingFile {
  file: File;
  preview?: string;
  uploading: boolean;
  url?: string;
}

interface ChatPanelProps {
  conversation: Conversation | undefined;
  messages: Message[];
  isLoading: boolean;
  currentUserId: string;
  messageText: string;
  onMessageTextChange: (text: string) => void;
  onSendMessage: (attachmentUrls?: string[]) => void;
  isSending: boolean;
  onBack: () => void;
  contractId?: string;
  onDismissContract?: () => void;
  adminUserId?: string;
}

export function ChatPanel({
  conversation,
  messages,
  isLoading,
  currentUserId,
  messageText,
  onMessageTextChange,
  onSendMessage,
  isSending,
  onBack,
  contractId,
  onDismissContract,
  adminUserId,
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const uploadMutation = useUploadAttachment();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => {
      pendingFiles.forEach((pf) => {
        if (pf.preview) URL.revokeObjectURL(pf.preview);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remaining = MAX_FILES - pendingFiles.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_FILES} files allowed`);
      return;
    }

    const selected = files.slice(0, remaining);
    const oversized = selected.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length) {
      toast.error('Some files exceed the 10 MB limit and were skipped');
    }

    const valid = selected.filter((f) => f.size <= MAX_FILE_SIZE);
    const newPending: PendingFile[] = valid.map((file) => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      uploading: false,
    }));

    setPendingFiles((prev) => [...prev, ...newPending]);
    // Reset input so same file can be re-selected
    e.target.value = '';
  }, [pendingFiles.length]);

  const removeFile = useCallback((index: number) => {
    setPendingFiles((prev) => {
      const removed = prev[index];
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleSend = useCallback(async () => {
    const hasText = messageText.trim().length > 0;
    const hasFiles = pendingFiles.length > 0;
    if (!hasText && !hasFiles) return;

    // Upload any pending files that haven't been uploaded yet
    const toUpload = pendingFiles.filter((pf) => !pf.url);
    const uploadedUrls: string[] = pendingFiles.filter((pf) => pf.url).map((pf) => pf.url!);

    if (toUpload.length > 0) {
      setPendingFiles((prev) => prev.map((pf) => ({ ...pf, uploading: !pf.url })));
      for (const pf of toUpload) {
        try {
          const result = await uploadMutation.mutateAsync(pf.file);
          uploadedUrls.push(result.url);
        } catch {
          toast.error(`Failed to upload ${pf.file.name}`);
          setPendingFiles((prev) => prev.map((p) => ({ ...p, uploading: false })));
          return;
        }
      }
    }

    onSendMessage(uploadedUrls.length > 0 ? uploadedUrls : undefined);

    // Clear pending files
    pendingFiles.forEach((pf) => {
      if (pf.preview) URL.revokeObjectURL(pf.preview);
    });
    setPendingFiles([]);
  }, [messageText, pendingFiles, onSendMessage, uploadMutation]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isAdmin = adminUserId && conversation?.participantId === adminUserId;
  const displayName = isAdmin ? 'Customer Support' : (conversation?.participant?.name ?? 'Unknown User');
  const isUploading = pendingFiles.some((pf) => pf.uploading);
  const canSend = (messageText.trim().length > 0 || pendingFiles.length > 0) && !isSending && !isUploading;

  return (
    <>
      {/* Chat Header */}
      <div className="flex items-center gap-3 border-b border-dt-border p-3">
        <button onClick={onBack} className="sm:hidden" aria-label="Back to conversations">
          <ArrowLeft className="h-5 w-5 text-dt-text-muted" />
        </button>
        {isAdmin ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
            <Headset className="h-4 w-4" />
          </div>
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
            {conversation?.participant?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-dt-text">{displayName}</p>
        </div>
      </div>

      {/* Contract Context Banner */}
      {contractId && onDismissContract && (
        <ContractContextBanner contractId={contractId} onDismiss={onDismissContract} />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center p-8"><Spinner size="md" /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-sm text-dt-text-muted">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} isOwn={msg.senderId === currentUserId} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Pending Attachments */}
      {pendingFiles.length > 0 && (
        <div className="flex gap-2 overflow-x-auto border-t border-dt-border px-3 py-2">
          {pendingFiles.map((pf, i) => (
            <div key={i} className="relative flex-shrink-0">
              {pf.preview ? (
                <img src={pf.preview} alt={pf.file.name} className="h-14 w-14 rounded-lg border border-dt-border object-cover" />
              ) : (
                <div className="flex h-14 w-14 flex-col items-center justify-center rounded-lg border border-dt-border bg-slate-100 dark:bg-slate-800">
                  <FileText className="h-5 w-5 text-dt-text-muted" />
                  <span className="mt-0.5 max-w-[50px] truncate text-[9px] text-dt-text-muted">{pf.file.name.split('.').pop()}</span>
                </div>
              )}
              {pf.uploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
                  <Spinner size="sm" />
                </div>
              )}
              <button
                onClick={() => removeFile(i)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600"
                aria-label={`Remove ${pf.file.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Message Input */}
      <div className="border-t border-dt-border p-3">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
            onChange={handleFileSelect}
            className="hidden"
            aria-label="Attach files"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 rounded-lg p-2 text-dt-text-muted transition hover:bg-slate-100 hover:text-dt-text dark:hover:bg-slate-800"
            aria-label="Attach file"
            title="Attach file (PDF, images, docs)"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <Input
            value={messageText}
            onChange={(e) => onMessageTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 border-dt-border"
            aria-label="Message input"
          />
          <Button
            onClick={handleSend}
            disabled={!canSend}
            className="bg-blue-600 text-white hover:bg-blue-700"
            aria-label="Send message"
          >
            {isSending || isUploading ? <Spinner size="sm" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </>
  );
}
