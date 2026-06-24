'use client';

import { useState } from 'react';
import { MessageSquareReply } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useSubmitReviewResponse } from '@/hooks/queries/use-reviews';

interface ReviewResponseFormProps {
  reviewId: string;
  onSuccess?: () => void;
}

export function ReviewResponseForm({ reviewId, onSuccess }: ReviewResponseFormProps) {
  const [text, setText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const mutation = useSubmitReviewResponse();

  const handleSubmit = () => {
    if (text.trim().length < 10) {
      toast.error('Response must be at least 10 characters');
      return;
    }
    mutation.mutate(
      { reviewId, responseText: text.trim() },
      {
        onSuccess: () => {
          toast.success('Response submitted successfully');
          setText('');
          setIsOpen(false);
          onSuccess?.();
        },
        onError: (err) => {
          toast.error(err.message || 'Failed to submit response');
        },
      },
    );
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
      >
        <MessageSquareReply className="h-3 w-3" />
        Write a response
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-2 rounded-lg border border-dt-border bg-dt-surface-alt p-3">
      <label htmlFor={`response-${reviewId}`} className="text-xs font-medium text-dt-text-muted">
        Your response (one-time, cannot be edited)
      </label>
      <textarea
        id={`response-${reviewId}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your response to this review..."
        rows={3}
        maxLength={2000}
        className="w-full rounded-md border border-dt-border bg-dt-surface px-3 py-2 text-sm text-dt-text placeholder:text-dt-text-muted/50 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-dt-text-muted">{text.length}/2000</span>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setIsOpen(false); setText(''); }}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={text.trim().length < 10 || mutation.isPending}
            onClick={handleSubmit}
            className="bg-emerald-500 text-white hover:bg-emerald-600"
          >
            {mutation.isPending ? 'Submitting...' : 'Submit Response'}
          </Button>
        </div>
      </div>
    </div>
  );
}
