'use client';

import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StarRating } from './star-rating';
import { CLIENT_REVIEW_LABELS, FREELANCER_REVIEW_LABELS } from '@/lib/review-utils';
import { cn } from '@/lib/utils';
import type { ReviewSummary as ReviewSummaryType } from '@/lib/api/review';

interface ReviewSummaryProps {
  summary: ReviewSummaryType;
  /** Role of the user whose reviews are being summarized */
  subjectRole?: 'FREELANCER' | 'CLIENT';
  className?: string;
}

/** Category labels for reviews received by a freelancer (authored by clients) */
const FREELANCER_CATEGORY_LABELS = [
  { key: 'averageCommunication', label: CLIENT_REVIEW_LABELS.communication },
  { key: 'averageQuality', label: CLIENT_REVIEW_LABELS.quality },
  { key: 'averageTimeliness', label: CLIENT_REVIEW_LABELS.timeliness },
  { key: 'averageProfessionalism', label: CLIENT_REVIEW_LABELS.professionalism },
] as const;

/** Category labels for reviews received by a client (authored by freelancers) */
const CLIENT_CATEGORY_LABELS = [
  { key: 'averageCommunication', label: FREELANCER_REVIEW_LABELS.communication },
  { key: 'averageQuality', label: FREELANCER_REVIEW_LABELS.quality },
  { key: 'averageTimeliness', label: FREELANCER_REVIEW_LABELS.timeliness },
  { key: 'averageProfessionalism', label: FREELANCER_REVIEW_LABELS.professionalism },
] as const;

export function ReviewSummaryCard({ summary, subjectRole, className }: ReviewSummaryProps) {
  const categoryLabels = subjectRole === 'CLIENT' ? CLIENT_CATEGORY_LABELS : FREELANCER_CATEGORY_LABELS;
  const maxCount = Math.max(...Object.values(summary.ratingDistribution), 1);

  return (
    <Card className={cn('border-dt-border bg-dt-surface shadow-lg', className)}>
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 sm:flex-row">
          {/* Average Score */}
          <div className="flex flex-col items-center justify-center gap-1 sm:min-w-[120px]">
            <div className="text-4xl font-bold text-dt-text">
              {summary.averageRating > 0 ? summary.averageRating.toFixed(1) : '—'}
            </div>
            <StarRating value={summary.averageRating} readonly size="sm" />
            <p className="text-xs text-dt-text-muted">
              {summary.totalReviews} review{summary.totalReviews !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = summary.ratingDistribution[stars] ?? 0;
              const pct = summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0;

              return (
                <div key={stars} className="flex items-center gap-2 text-sm">
                  <span className="flex w-8 items-center justify-end gap-0.5 text-dt-text-muted">
                    {stars} <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  </span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs text-dt-text-muted">
                    {pct > 0 ? `${Math.round(pct)}%` : '0%'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Averages */}
        {summary.totalReviews > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-dt-border pt-4 sm:grid-cols-4">
            {categoryLabels.map(({ key, label }) => {
              const val = summary[key];
              return (
                <div key={key} className="text-center">
                  <p className="text-xs text-dt-text-muted">{label}</p>
                  <p className="mt-0.5 text-lg font-semibold text-dt-text">
                    {val > 0 ? val.toFixed(1) : '—'}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
