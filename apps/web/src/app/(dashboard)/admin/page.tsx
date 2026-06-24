'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  Users,
  Briefcase,
  Shield,
  Star,
  MessageSquare,
  TrendingUp,
  DollarSign,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

import { Spinner } from '@/components/ui/spinner';
import { useAdminStats, useAdminTrends, useAdminActivity } from '@/hooks/queries/use-admin';
import { KpiCard } from '@/components/admin/admin-kpi-card';
import { AdminActivityFeed } from '@/components/admin/admin-activity-feed';
import { AdminHealthSidebar } from '@/components/admin/admin-health-sidebar';

/**
 * Dynamically import the charts section (recharts ~300KB).
 * This is loaded only when the admin page mounts, not during initial compile.
 * (Vercel bundle-dynamic-imports rule)
 */
const AdminCharts = dynamic(
  () => import('@/components/admin/admin-charts').then((m) => m.AdminCharts),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[320px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    ),
  },
);

export default function AdminDashboard() {
  const { data: stats, isLoading: loadingStats } = useAdminStats();
  const { data: trends, isLoading: loadingTrends } = useAdminTrends();
  const { data: activity, isLoading: loadingActivity } = useAdminActivity(12);

  const userGrowth = useMemo(() => {
    if (!stats) return 0;
    const prev = stats.users.newLastMonth || 1;
    return Math.round(((stats.users.newThisMonth - prev) / prev) * 100);
  }, [stats]);

  const jobStatusData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Open', value: stats.jobs.open },
      { name: 'In Progress', value: stats.jobs.inProgress },
      { name: 'Completed', value: stats.jobs.completed },
      { name: 'Cancelled', value: stats.jobs.cancelled },
      { name: 'Disputed', value: stats.jobs.disputed },
    ].filter((d) => d.value > 0);
  }, [stats]);

  const userRoleData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Freelancers', value: stats.users.freelancers },
      { name: 'Clients', value: stats.users.clients },
      { name: 'Admins', value: stats.users.admins },
    ].filter((d) => d.value > 0);
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
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <AlertTriangle className="mb-4 h-12 w-12 text-dt-text-muted opacity-40" />
        <h2 className="text-lg font-medium text-dt-text">Failed to load dashboard</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-dt-text">
            <Activity className="h-6 w-6 text-emerald-500" />
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-dt-text-muted">
            Platform overview and key metrics
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-dt-border bg-dt-surface px-3 py-1.5 text-xs text-dt-text-muted">
          <Clock className="h-3.5 w-3.5" /> Auto-refreshes every minute
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <KpiCard title="Total Users" value={stats.users.total} subtitle={`${stats.users.active} active · ${stats.users.suspended} suspended`} icon={<Users className="h-5 w-5" />} trend={userGrowth} trendLabel="vs last month" href="/admin/users" color="blue" />
        <KpiCard title="Total Jobs" value={stats.jobs.total} subtitle={`${stats.jobs.open} open · ${stats.jobs.inProgress} in progress`} icon={<Briefcase className="h-5 w-5" />} href="/admin/jobs" color="emerald" />
        <KpiCard title="Contracts Value" value={`$${stats.contracts.totalValue.toLocaleString()}`} subtitle={`${stats.contracts.total} contracts · avg $${Math.round(stats.contracts.avgValue).toLocaleString()}`} icon={<DollarSign className="h-5 w-5" />} href="/admin/contracts" color="violet" />
        <KpiCard title="Active Disputes" value={stats.disputes.open + stats.disputes.voting} subtitle={`${stats.disputes.resolved} resolved · ${stats.disputes.total} total`} icon={<Shield className="h-5 w-5" />} href="/admin/disputes" color="amber" />
        <KpiCard title="Reviews" value={stats.reviews.total} subtitle={`Avg ${stats.reviews.avgRating.toFixed(1)} ★ · ${stats.reviews.thisMonth} this month`} icon={<Star className="h-5 w-5" />} href="/admin/reviews" color="cyan" />
        <KpiCard title="Messages" value={stats.messages.total} subtitle={`${stats.messages.thisMonth} this month`} icon={<MessageSquare className="h-5 w-5" />} href="/admin/messages" color="rose" />
        <KpiCard title="New Users (Month)" value={stats.users.newThisMonth} subtitle={`${stats.users.freelancers} freelancers · ${stats.users.clients} clients`} icon={<TrendingUp className="h-5 w-5" />} trend={userGrowth} trendLabel="growth" color="emerald" />
        <KpiCard title="Completed (Month)" value={stats.contracts.completedThisMonth} subtitle={`${stats.jobs.completed} jobs completed total`} icon={<CheckCircle2 className="h-5 w-5" />} color="blue" />
      </div>

      {/* Charts (dynamically loaded — recharts ~300KB) */}
      <AdminCharts
        trends={trends}
        loadingTrends={loadingTrends}
        jobStatusData={jobStatusData}
        userRoleData={userRoleData}
      />

      {/* Recent Activity + Quick Stats */}
      <div className="grid gap-6 lg:grid-cols-3">
        <AdminActivityFeed activity={activity} loading={loadingActivity} />
        <AdminHealthSidebar stats={stats} />
      </div>
    </div>
  );
}
