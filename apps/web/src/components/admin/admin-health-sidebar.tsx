'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PlatformStats } from '@/lib/api/admin';

interface AdminHealthSidebarProps {
  stats: PlatformStats;
}

export function AdminHealthSidebar({ stats }: AdminHealthSidebarProps) {
  return (
    <Card className="border-dt-border bg-dt-surface shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-dt-text">Platform Health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Dispute Rate</p>
          <p className="mt-1 text-2xl font-bold text-emerald-800 dark:text-emerald-300">
            {stats.contracts.total > 0
              ? `${((stats.disputes.total / stats.contracts.total) * 100).toFixed(1)}%`
              : '0%'}
          </p>
          <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-500">
            {stats.disputes.total} disputes / {stats.contracts.total} contracts
          </p>
        </div>

        <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-950/30">
          <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Completion Rate</p>
          <p className="mt-1 text-2xl font-bold text-blue-800 dark:text-blue-300">
            {stats.contracts.total > 0
              ? `${((stats.contracts.completed / stats.contracts.total) * 100).toFixed(1)}%`
              : '0%'}
          </p>
          <p className="mt-0.5 text-xs text-blue-600 dark:text-blue-500">
            {stats.contracts.completed} / {stats.contracts.total} contracts
          </p>
        </div>

        <div className="rounded-xl bg-violet-50 p-4 dark:bg-violet-950/30">
          <p className="text-xs font-medium text-violet-700 dark:text-violet-400">Avg Rating</p>
          <p className="mt-1 text-2xl font-bold text-violet-800 dark:text-violet-300">
            {stats.reviews.avgRating.toFixed(1)} <span className="text-lg">★</span>
          </p>
          <p className="mt-0.5 text-xs text-violet-600 dark:text-violet-500">
            From {stats.reviews.total} reviews
          </p>
        </div>

        <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-950/30">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Active Disputes</p>
          <p className="mt-1 text-2xl font-bold text-amber-800 dark:text-amber-300">
            {stats.disputes.open + stats.disputes.voting}
          </p>
          <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-500">
            {stats.disputes.open} open · {stats.disputes.voting} voting
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
