'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  BarChart3,
  Users,
  Briefcase,
  DollarSign,
  Star,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useAdminStats, useAdminTrends } from '@/hooks/queries/use-admin';

/** Dynamically import recharts-heavy chart section (~300KB saved) */
const ReportsCharts = dynamic(
  () => import('@/components/admin/admin-reports-charts').then((m) => m.ReportsCharts),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[320px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    ),
  },
);

export default function AdminReportsPage() {
  const { data: stats, isLoading: loadingStats } = useAdminStats();
  const { data: trends, isLoading: loadingTrends } = useAdminTrends();

  const jobPipelineData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Open', value: stats.jobs.open, fill: '#22c55e' },
      { name: 'In Progress', value: stats.jobs.inProgress, fill: '#3b82f6' },
      { name: 'Completed', value: stats.jobs.completed, fill: '#8b5cf6' },
      { name: 'Cancelled', value: stats.jobs.cancelled, fill: '#64748b' },
      { name: 'Disputed', value: stats.jobs.disputed, fill: '#ef4444' },
    ];
  }, [stats]);

  const disputeData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Open', value: stats.disputes.open },
      { name: 'Voting', value: stats.disputes.voting },
      { name: 'Resolved', value: stats.disputes.resolved },
      { name: 'Appealed', value: stats.disputes.appealed },
    ].filter((d) => d.value > 0);
  }, [stats]);

  const platformHealthData = useMemo(() => {
    if (!stats) return [];
    const completionRate = stats.contracts.total > 0 ? (stats.contracts.completed / stats.contracts.total) * 100 : 0;
    const disputeRate = stats.contracts.total > 0 ? (stats.disputes.total / stats.contracts.total) * 100 : 0;
    return [
      { name: 'Completion Rate', value: Math.round(completionRate), fill: '#22c55e' },
      { name: 'Active Rate', value: stats.contracts.total > 0 ? Math.round((stats.contracts.active / stats.contracts.total) * 100) : 0, fill: '#3b82f6' },
      { name: 'Dispute Rate', value: Math.round(disputeRate), fill: '#ef4444' },
    ];
  }, [stats]);

  if (loadingStats) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-dt-text-muted">
        Failed to load reports
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-dt-text">
          <BarChart3 className="h-6 w-6 text-violet-500" />
          Analytics &amp; Reports
        </h1>
        <p className="mt-1 text-sm text-dt-text-muted">
          Comprehensive platform analytics and performance metrics
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-dt-border bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-white">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Total Users</p>
                <p className="text-xl font-bold text-emerald-800 dark:text-emerald-300">{stats.users.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-dt-border bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 text-white">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Total Jobs</p>
                <p className="text-xl font-bold text-blue-800 dark:text-blue-300">{stats.jobs.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-dt-border bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950/30 dark:to-violet-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500 text-white">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-violet-700 dark:text-violet-400">Total Revenue</p>
                <p className="text-xl font-bold text-violet-800 dark:text-violet-300">
                  ${stats.contracts.totalValue.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-dt-border bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-white">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Avg Rating</p>
                <p className="text-xl font-bold text-amber-800 dark:text-amber-300">
                  {stats.reviews.avgRating.toFixed(1)} ★
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts — dynamically loaded (recharts ~300KB) */}
      <ReportsCharts
        trends={trends}
        loadingTrends={loadingTrends}
        jobPipelineData={jobPipelineData}
        disputeData={disputeData}
        platformHealthData={platformHealthData}
        activeUsers={stats.users.active}
        totalReviews={stats.reviews.total}
        messagesThisMonth={stats.messages.thisMonth}
      />
    </div>
  );
}
