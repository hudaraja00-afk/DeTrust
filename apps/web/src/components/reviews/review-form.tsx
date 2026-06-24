'use client';

import { useState, useCallback } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from './star-rating';
import { CLIENT_REVIEW_LABELS, FREELANCER_REVIEW_LABELS } from '@/lib/review-utils';
import { useSubmitReview } from '@/hooks/queries/use-reviews';

interface ReviewFormProps {
  contractId: string;
  contractTitle: string;
  subjectName: string;
  /** Whether the reviewer is the client (true) or freelancer (false) */
  isClient: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/** Client reviewing freelancer */
const CLIENT_RATING_CATEGORIES = [
  { key: 'communicationRating', label: CLIENT_REVIEW_LABELS.communication },
  { key: 'qualityRating', label: CLIENT_REVIEW_LABELS.quality },
  { key: 'timelinessRating', label: CLIENT_REVIEW_LABELS.timeliness },
  { key: 'professionalismRating', label: CLIENT_REVIEW_LABELS.professionalism },
] as const;

/** Freelancer reviewing client (SRS FE-2: Job Clarity rating) */
const FREELANCER_RATING_CATEGORIES = [
  { key: 'communicationRating', label: FREELANCER_REVIEW_LABELS.communication },
  { key: 'qualityRating', label: FREELANCER_REVIEW_LABELS.quality },
  { key: 'timelinessRating', label: FREELANCER_REVIEW_LABELS.timeliness },
  { key: 'professionalismRating', label: FREELANCER_REVIEW_LABELS.professionalism },
] as const;

type RatingKey = (typeof CLIENT_RATING_CATEGORIES)[number]['key'];

export function ReviewForm({
  contractId,
  contractTitle,
  subjectName,
  isClient,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const [overallRating, setOverallRating] = useState(0);
  const [categoryRatings, setCategoryRatings] = useState<Record<RatingKey, number>>({
    communicationRating: 0,
    qualityRating: 0,
    timelinessRating: 0,
    professionalismRating: 0,
  });
  const [comment, setComment] = useState('');

  const submitReview = useSubmitReview();

  const ratingCategories = isClient ? CLIENT_RATING_CATEGORIES : FREELANCER_RATING_CATEGORIES;

  const handleCategoryChange = useCallback((key: RatingKey, value: number) => {
    setCategoryRatings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (overallRating === 0) {
      toast.error('Please provide an overall rating');
      return;
    }

    const input: Parameters<typeof submitReview.mutateAsync>[0] = {
      contractId,
      overallRating,
      ...(categoryRatings.communicationRating > 0 && { communicationRating: categoryRatings.communicationRating }),
      ...(categoryRatings.qualityRating > 0 && { qualityRating: categoryRatings.qualityRating }),
      ...(categoryRatings.timelinessRating > 0 && { timelinessRating: categoryRatings.timelinessRating }),
      ...(categoryRatings.professionalismRating > 0 && { professionalismRating: categoryRatings.professionalismRating }),
      ...(comment.trim().length >= 10 && { comment: comment.trim() }),
    };

    try {
      await submitReview.mutateAsync(input);
      toast.success('Review submitted successfully!');
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit review');
    }
  }, [overallRating, categoryRatings, comment, contractId, submitReview, onSuccess]);

  return (
    <Card className="border-dt-border bg-dt-surface shadow-lg">
      <CardContent className="space-y-6 p-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold text-dt-text">
            {isClient ? 'Rate the Freelancer' : 'Rate the Client'}
          </h3>
          <p className="mt-1 text-sm text-dt-text-muted">
            Share your experience working with <span className="font-medium text-dt-text">{subjectName}</span> on{' '}
            <span className="font-medium text-dt-text">&ldquo;{contractTitle}&rdquo;</span>
          </p>
        </div>

        {/* Overall Rating */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-dt-text">Overall Rating *</label>
          <StarRating value={overallRating} onChange={setOverallRating} size="lg" />
          {overallRating > 0 && (
            <p className="text-xs text-dt-text-muted">
              {overallRating === 5
                ? 'Excellent'
                : overallRating === 4
                  ? 'Very Good'
                  : overallRating === 3
                    ? 'Good'
                    : overallRating === 2
                      ? 'Fair'
                      : 'Poor'}
            </p>
          )}
        </div>

        {/* Category Ratings */}
        <div className="grid gap-4 sm:grid-cols-2">
          {ratingCategories.map((cat) => (
            <div key={cat.key} className="space-y-1">
              <label className="text-sm text-dt-text-muted">{cat.label}</label>
              <StarRating
                value={categoryRatings[cat.key]}
                onChange={(v) => handleCategoryChange(cat.key, v)}
                size="sm"
              />
            </div>
          ))}
        </div>

        {/* Comment */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-dt-text">
            {isClient ? 'Comment about the freelancer' : 'Comment about the client (Job Clarity, etc.)'}
          </label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={
              isClient
                ? 'Share your experience working with this freelancer...'
                : 'How clear were the job requirements? Rate the client experience...'
            }
            rows={4}
            maxLength={2000}
            className="border-dt-border bg-dt-surface text-dt-text placeholder:text-dt-text-muted"
          />
          <p className="text-xs text-dt-text-muted">
            {comment.length}/2000 characters{comment.length > 0 && comment.length < 10 && ' (min 10 characters)'}
          </p>
        </div>

        {/* Double-blind notice */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950/30">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>Double-blind review:</strong> Your review will be hidden from{' '}
            {isClient ? 'the freelancer' : 'the client'} until they also submit their review or 14 days pass.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} className="border-dt-border text-dt-text-muted">
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={overallRating === 0 || submitReview.isPending}
            className="bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {submitReview.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Review
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
