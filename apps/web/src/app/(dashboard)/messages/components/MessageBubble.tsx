'use client';

import { FileText, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from '@detrust/types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif']);

function getExtension(url: string): string {
  try {
    const path = new URL(url, 'http://localhost').pathname;
    return path.split('.').pop()?.toLowerCase() ?? '';
  } catch {
    return '';
  }
}

function isImageUrl(url: string): boolean {
  // Check extension OR if the URL contains hints (IPFS URLs often lack extensions)
  const ext = getExtension(url);
  if (IMAGE_EXTENSIONS.has(ext)) return true;
  // Fallback: URLs that don't look like images get rendered as file links
  return false;
}

function AttachmentItem({ url, isOwn }: { url: string; isOwn: boolean }) {
  if (isImageUrl(url)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        <img
          src={url}
          alt="Attachment"
          className="max-h-48 max-w-full rounded-lg border border-white/20 object-contain"
          loading="lazy"
        />
      </a>
    );
  }

  const ext = getExtension(url) || 'file';
  return (
    <a
      href={`${url}?download=1`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition',
        isOwn
          ? 'bg-blue-700/40 text-blue-100 hover:bg-blue-700/60'
          : 'bg-slate-300/60 text-slate-700 hover:bg-slate-300 dark:bg-slate-600/60 dark:text-slate-200 dark:hover:bg-slate-600'
      )}
    >
      <FileText className="h-4 w-4 flex-shrink-0" />
      <span className="truncate">{ext.toUpperCase()} file</span>
      <Download className="ml-auto h-3.5 w-3.5 flex-shrink-0 opacity-60" />
    </a>
  );
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const hasAttachments = message.attachments && message.attachments.length > 0;

  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2',
          isOwn
            ? 'rounded-br-md bg-blue-600 text-white'
            : 'rounded-bl-md bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-100'
        )}
      >
        {message.content && (
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        )}
        {hasAttachments && (
          <div className={cn('space-y-1.5', message.content && 'mt-2')}>
            {message.attachments.map((url, i) => (
              <AttachmentItem key={i} url={url} isOwn={isOwn} />
            ))}
          </div>
        )}
        <p
          className={cn(
            'mt-1 text-[10px]',
            isOwn ? 'text-blue-200' : 'text-slate-500 dark:text-slate-400'
          )}
        >
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
          {isOwn && message.readAt && (
            <span className="ml-1.5" title="Read">✓✓</span>
          )}
        </p>
      </div>
    </div>
  );
}
