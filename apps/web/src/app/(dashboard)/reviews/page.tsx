'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { MessageSquareText, Star } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { ReviewSummaryCard } from '@/components/reviews/review-summary';
import { ReviewList } from '@/components/reviews/review-list';
import { ReviewFilters } from '@/components/reviews/review-filters';

/** Dynamically import recharts-heavy analytics */
const ReviewAnalytics = dynamic(
  () => import('@/components/reviews/review-analytics').then((m) => m.ReviewAnalytics),
  { ssr: false },
);
import { useUserReviews, useReviewSummary } from '@/hooks/queries/use-reviews';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import type { GetUserReviewsParams } from '@/lib/api/review';

const TABS = [
  { value: '', label: 'All Reviews' },
  { value: 'as_freelancer', label: 'As Freelancer' },
  { value: 'as_client', label: 'As Client' },
] as const;

type TabValue = (typeof TABS)[number]['value'];

export default function ReviewsPage() {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';
  const userRole = user?.role as 'CLIENT' | 'FREELANCER' | undefined;
  const [activeTab, setActiveTab] = useState<TabValue>('');
  const [filters, setFilters] = useState<GetUserReviewsParams>({});

  const params: GetUserReviewsParams = {
    page: filters.page ?? 1,
    limit: filters.limit ?? 50,
    minRating: filters.minRating,
    maxRating: filters.maxRating,
    search: filters.search,
    sort: filters.sort,
    order: filters.order,
    ...(activeTab ? { role: activeTab as 'as_client' | 'as_freelancer' } : {}),
  };

  const { data: reviewsData, isLoading: loadingReviews } = useUserReviews(userId, params);
  const { data: summary, isLoading: loadingSummary } = useReviewSummary(userId);

  const reviews = reviewsData?.items ?? [];

  const handleTabChange = (tab: TabValue) => {
    setActiveTab(tab);
    setFilters({ ...filters, page: 1 });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-dt-text">
          <MessageSquareText className="h-6 w-6 text-emerald-500" />
          Reviews & Feedback
        </h1>
        <p className="mt-1 text-dt-text-muted">
          View your ratings and feedback from completed contracts
        </p>
      </div>

      {/* Summary */}
      {loadingSummary ? (
        <div className="flex min-h-[120px] items-center justify-center">
          <Spinner size="md" />
        </div>
      ) : summary ? (
        <ReviewSummaryCard summary={summary} subjectRole={userRole} />
      ) : null}

      {/* Review Analytics Charts (M3-I7) */}
      {summary && summary.totalReviews > 0 && (
        <ReviewAnalytics summary={summary} subjectRole={userRole} />
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-dt-border pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={cn(
              'whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition',
              activeTab === tab.value
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-dt-text-muted hover:bg-dt-surface-alt'
            )}
          >
            {tab.label}
            {tab.value === '' && summary && (
              <Badge className="ml-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                {summary.totalReviews}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Search & Filters (M3-I9) */}
      <ReviewFilters filters={filters} onFiltersChange={setFilters} />

      {/* Reviews List */}
      {loadingReviews ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <ReviewList
          reviews={reviews}
          currentUserId={userId}
          emptyMessage={
            activeTab
              ? `No reviews ${activeTab === 'as_freelancer' ? 'as a freelancer' : 'as a client'} yet`
              : 'No reviews received yet. Complete contracts to get reviews!'
          }
        />
      )}

      {/* Immutability notice */}
      <Card className="border-dt-border bg-dt-surface">
        <CardContent className="flex items-start gap-3 p-4">
          <Star className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-medium text-dt-text">Reviews are permanent</p>
            <p className="mt-0.5 text-xs text-dt-text-muted">
              All reviews are stored immutably on the blockchain. Once submitted, they cannot be edited or deleted.
              This ensures transparent and trustworthy reputation records.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
