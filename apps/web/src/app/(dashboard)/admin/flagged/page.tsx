'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Shield,
  User,
  ExternalLink,
  Ban,
  CheckCircle2,
  TrendingDown,
  Scale,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useAdminFlaggedAccounts, useUpdateUserStatus } from '@/hooks/queries/use-admin';
import { cn } from '@/lib/utils';
import type { FlaggedUser } from '@/lib/api/admin';

// =============================================================================
// RISK CONFIG
// =============================================================================

const riskLevelConfig = {
  HIGH: { label: 'High Risk', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  MEDIUM: { label: 'Medium Risk', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: <Shield className="h-3.5 w-3.5" /> },
  LOW: { label: 'Low Risk', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: <TrendingDown className="h-3.5 w-3.5" /> },
};

const riskFlagLabels: Record<string, { label: string; color: string }> = {
  SUSPENDED: { label: 'Suspended', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  LOW_TRUST: { label: 'Low Trust Score', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  HIGH_DISPUTE_RATE: { label: 'High Dispute Rate', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  MULTIPLE_DISPUTES: { label: 'Multiple Disputes', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
};

// =============================================================================
// PAGE
// =============================================================================

const FLAGGED_PAGE_LIMIT = 50;

export default function AdminFlaggedPage() {
  const [page] = useState(1);
  const { data, isLoading } = useAdminFlaggedAccounts({ page, limit: FLAGGED_PAGE_LIMIT });
  const updateStatus = useUpdateUserStatus();

  const handleToggleStatus = (user: FlaggedUser) => {
    const newStatus = user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    updateStatus.mutate({ userId: user.id, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const flagged = data?.items ?? [];
  const summary = data?.riskSummary ?? { high: 0, medium: 0, low: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-dt-text">
          <AlertTriangle className="h-6 w-6 text-amber-500" />
          Flagged Accounts
        </h1>
        <p className="mt-1 text-sm text-dt-text-muted">
          Auto-detected accounts with suspicious activity patterns
        </p>
      </div>

      {/* Risk Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/40">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">{summary.high}</p>
              <p className="text-xs font-medium text-red-600 dark:text-red-500">High Risk</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
              <Shield className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{summary.medium}</p>
              <p className="text-xs font-medium text-amber-600 dark:text-amber-500">Medium Risk</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50/50 dark:border-yellow-900/50 dark:bg-yellow-950/20">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-900/40">
              <TrendingDown className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{summary.low}</p>
              <p className="text-xs font-medium text-yellow-600 dark:text-yellow-500">Low Risk</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flagged Accounts List */}
      {flagged.length === 0 ? (
        <Card className="border-dt-border bg-dt-surface">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <CheckCircle2 className="mb-4 h-12 w-12 text-emerald-500 opacity-50" />
            <h3 className="text-lg font-medium text-dt-text">No Flagged Accounts</h3>
            <p className="mt-1 text-sm text-dt-text-muted">
              All users are within normal parameters. No suspicious activity detected.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {flagged.map((user) => {
            const risk = riskLevelConfig[user.riskLevel];
            return (
              <Card key={user.id} className="border-dt-border bg-dt-surface transition hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                          <User className="h-4 w-4 text-dt-text-muted" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-dt-text">
                            {user.name ?? 'Unknown User'}
                          </h3>
                          <p className="text-xs text-dt-text-muted">{user.email ?? user.walletAddress ?? 'No contact'}</p>
                        </div>
                        <Badge className={cn('flex items-center gap-1 text-xs', risk.color)}>
                          {risk.icon} {risk.label}
                        </Badge>
                        <Badge className={cn('text-xs', user.status === 'SUSPENDED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400')}>
                          {user.status}
                        </Badge>
                      </div>

                      {/* Risk Flags */}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {user.riskFlags.map((flag) => {
                          const flagConfig = riskFlagLabels[flag] ?? { label: flag, color: 'bg-gray-100 text-gray-600' };
                          return (
                            <span key={flag} className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium', flagConfig.color)}>
                              {flagConfig.label}
                            </span>
                          );
                        })}
                      </div>

                      {/* Stats Row */}
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-dt-text-muted">
                        <span className="flex items-center gap-1">
                          <Scale className="h-3 w-3" />
                          Trust: {user.trustScore.toFixed(1)}
                        </span>
                        <span>{user.contracts} contracts</span>
                        <span className={cn(user.disputes > 0 && 'text-amber-600 dark:text-amber-400 font-medium')}>
                          {user.disputes} disputes
                        </span>
                        <span>{user.reviews} reviews</span>
                        <span className="capitalize">{user.role.toLowerCase()}</span>
                        <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Link href={`/admin/users?search=${encodeURIComponent(user.email ?? user.name ?? '')}`}>
                        <Button variant="outline" size="sm" className="w-full gap-1 text-xs">
                          <ExternalLink className="h-3 w-3" /> View
                        </Button>
                      </Link>
                      <Button
                        variant={user.status === 'SUSPENDED' ? 'default' : 'destructive'}
                        size="sm"
                        className="gap-1 text-xs"
                        onClick={() => handleToggleStatus(user)}
                        disabled={updateStatus.isPending}
                      >
                        {user.status === 'SUSPENDED' ? (
                          <><CheckCircle2 className="h-3 w-3" /> Activate</>
                        ) : (
                          <><Ban className="h-3 w-3" /> Suspend</>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
