'use client';

import { MessageCircle } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center text-dt-text-muted">
      <MessageCircle className="mb-4 h-12 w-12 opacity-30" />
      <p className="text-lg font-medium">Select a conversation</p>
      <p className="mt-1 text-sm">
        Choose a conversation from the left to start chatting
      </p>
    </div>
  );
}
