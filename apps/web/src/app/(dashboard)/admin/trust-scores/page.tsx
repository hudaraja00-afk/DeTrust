'use client';

import { useState } from 'react';
import { Shield, Users, ShieldOff, ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { AdminTrustScoreFilters } from '@/components/admin/admin-trust-score-filters';
import { AdminTrustScoreTable } from '@/components/admin/admin-trust-score-table';
import { useAdminTrustScores } from '@/hooks/queries/use-admin';
import type { AdminTrustScoreListParams } from '@/lib/api/admin';

export default function AdminTrustScoresPage() {
  const [filters, setFilters] = useState<AdminTrustScoreListParams>({
    page: 1, limit: 20, sort: 'trustScore', order: 'desc', role: 'all',
  });
  const { data, isLoading } = useAdminTrustScores(filters);

  if (isLoading && !data) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Spinner size="lg" /></div>;
  }

  // Calculate quick stats from current data
  const entries = data?.items ?? [];
  const eligibleCount = entries.filter((e) => e.eligible).length;
  const ineligibleCount = entries.filter((e) => !e.eligible).length;
  const avgScore = eligibleCount > 0
    ? entries.filter((e) => e.eligible).reduce((sum, e) => sum + e.trustScore, 0) / eligibleCount
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-dt-text">
          <Shield className="h-6 w-6 text-emerald-500" /> Trust Score Management
        </h1>
        <p className="mt-1 text-sm text-dt-text-muted">
          View all user trust scores, filter by eligibility, and perform manual adjustments
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Shield} label="Avg Trust Score" value={avgScore.toFixed(1)} color="emerald" />
        <StatCard icon={Users} label="Eligible Users" value={eligibleCount} color="blue" />
        <StatCard icon={ShieldOff} label="Ineligible Users" value={ineligibleCount} color="amber" />
      </div>

      {/* Filters */}
      <AdminTrustScoreFilters filters={filters} onFiltersChange={setFilters} />

      {/* Table */}
      <AdminTrustScoreTable entries={entries} isLoading={isLoading} />

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-dt-text-muted">
            Page {data.page} of {data.totalPages} ({data.total} users)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm" disabled={!data.hasPrev}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Previous
            </Button>
            <Button
              variant="outline" size="sm" disabled={!data.hasNext}
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
          <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
          <div>
            <p className="text-sm font-medium text-dt-text">Trust Score Integrity</p>
            <p className="mt-0.5 text-xs text-dt-text-muted">
              Trust scores are computed using the SRS formula: weighted average of rating, completion rate, dispute outcomes, and experience.
              Scores require a minimum of 5 completed contracts. Manual adjustments are logged with reason and admin ID in
              the trust score history for full auditability.
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
