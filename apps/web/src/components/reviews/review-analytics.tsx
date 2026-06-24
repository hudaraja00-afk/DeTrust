'use client';

import { useMemo } from 'react';
import { BarChart2 } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CLIENT_REVIEW_LABELS, FREELANCER_REVIEW_LABELS } from '@/lib/review-utils';
import type { ReviewSummary } from '@/lib/api/review';

interface ReviewAnalyticsProps {
  summary: ReviewSummary;
  subjectRole?: 'FREELANCER' | 'CLIENT';
  className?: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length || !label) return null;

  return (
    <div className="rounded-lg border border-dt-border bg-dt-surface px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-dt-text">{label}</p>
      {payload.map((item) => (
        <p key={item.name} className="text-xs" style={{ color: item.color }}>
          {item.name}: {item.value.toFixed(1)}
        </p>
      ))}
    </div>
  );
}

export function ReviewAnalytics({ summary, subjectRole, className }: ReviewAnalyticsProps) {
  const labels = subjectRole === 'CLIENT' ? FREELANCER_REVIEW_LABELS : CLIENT_REVIEW_LABELS;

  const categoryData = useMemo(() => [
    { name: labels.communication, value: summary.averageCommunication },
    { name: labels.quality, value: summary.averageQuality },
    { name: labels.timeliness, value: summary.averageTimeliness },
    { name: labels.professionalism, value: summary.averageProfessionalism },
  ], [summary, labels]);

  const distributionData = useMemo(() =>
    [5, 4, 3, 2, 1].map((stars) => ({
      name: `${stars}★`,
      count: summary.ratingDistribution[stars] ?? 0,
    })),
  [summary.ratingDistribution]);

  if (summary.totalReviews === 0) return null;

  return (
    <Card className={cn('border-dt-border bg-dt-surface shadow-lg', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-dt-text">
          <BarChart2 className="h-5 w-5 text-emerald-500" />
          Review Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Category Comparison */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-dt-text-muted">Category Averages</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                  <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11 }} className="fill-dt-text-muted" />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} className="fill-dt-text-muted" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Rating" fill="#22c55e" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Rating Distribution */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-dt-text-muted">Rating Distribution</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-dt-text-muted" />
                  <YAxis tick={{ fontSize: 11 }} className="fill-dt-text-muted" allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="count" name="Reviews" fill="#eab308" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
