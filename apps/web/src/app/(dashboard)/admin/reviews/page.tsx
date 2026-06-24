'use client';

import { useState } from 'react';
import { Star, BarChart2, MessageSquareText, ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { AdminReviewFilters } from '@/components/admin/admin-review-filters';
import { AdminReviewTable } from '@/components/admin/admin-review-table';
import { useAdminStats, useAdminReviews } from '@/hooks/queries/use-admin';
import type { AdminReviewListParams } from '@/lib/api/admin';

export default function AdminReviewsPage() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const [filters, setFilters] = useState<AdminReviewListParams>({
    page: 1, limit: 20, sort: 'createdAt', order: 'desc',
  });
  const { data: reviewData, isLoading: reviewsLoading } = useAdminReviews(filters);

  if (statsLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-dt-text">
          <Star className="h-6 w-6 text-amber-500" /> Review Oversight
        </h1>
        <p className="mt-1 text-sm text-dt-text-muted">Browse and filter all platform reviews — admin bypasses double-blind</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={Star} label="Total Reviews" value={stats.reviews.total} color="amber" />
          <StatCard icon={BarChart2} label="Average Rating" value={`${stats.reviews.avgRating.toFixed(1)} ★`} color="emerald" />
          <StatCard icon={MessageSquareText} label="This Month" value={stats.reviews.thisMonth} color="blue" />
        </div>
      )}

      {/* Filters */}
      <AdminReviewFilters filters={filters} onFiltersChange={setFilters} />

      {/* Table */}
      <AdminReviewTable reviews={reviewData?.items ?? []} isLoading={reviewsLoading} />

      {/* Pagination */}
      {reviewData && reviewData.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-dt-text-muted">
            Page {reviewData.page} of {reviewData.totalPages} ({reviewData.total} reviews)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm" disabled={!reviewData.hasPrev}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Previous
            </Button>
            <Button
              variant="outline" size="sm" disabled={!reviewData.hasNext}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
            >
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Integrity notice */}
      <Card className="border-dt-border bg-dt-surface">
        <CardContent className="flex items-start gap-3 p-4">
          <Star className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-medium text-dt-text">Review Integrity</p>
            <p className="mt-0.5 text-xs text-dt-text-muted">
              All reviews are immutably stored. Reviews cannot be edited or deleted by any party — including admins — ensuring trust and transparency.
              Double-blind reviews: neither party sees the other&apos;s review until both submit or the 14-day window closes. Admins see all reviews for oversight.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string | number; color: string;
}) {
  const colors: Record<string, string> = {
    amber: 'from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20',
    emerald: 'from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20',
    blue: 'from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20',
  };
  const iconColors: Record<string, string> = { amber: 'bg-amber-500', emerald: 'bg-emerald-500', blue: 'bg-blue-500' };
  const textColors: Record<string, string> = {
    amber: 'text-amber-700 dark:text-amber-400',
    emerald: 'text-emerald-700 dark:text-emerald-400',
    blue: 'text-blue-700 dark:text-blue-400',
  };
  const valColors: Record<string, string> = {
    amber: 'text-amber-800 dark:text-amber-300',
    emerald: 'text-emerald-800 dark:text-emerald-300',
    blue: 'text-blue-800 dark:text-blue-300',
  };

  return (
    <Card className={`border-dt-border bg-gradient-to-br ${colors[color]}`}>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconColors[color]} text-white`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className={`text-xs font-medium ${textColors[color]}`}>{label}</p>
            <p className={`text-2xl font-bold ${valColors[color]}`}>{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
