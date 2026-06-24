'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shield, AlertTriangle, CheckCircle2, Clock, Scale } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import type { Dispute } from '@detrust/types';
import { useDisputes } from '@/hooks/queries/use-disputes';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import type { GetDisputesParams } from '@/lib/api/dispute';

const STATUS_TABS = [
  { value: '', label: 'All Disputes' },
  { value: 'OPEN', label: 'Open' },
  { value: 'VOTING', label: 'Voting' },
  { value: 'RESOLVED', label: 'Resolved' },
] as const;

type TabValue = (typeof STATUS_TABS)[number]['value'];

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  OPEN: { icon: <AlertTriangle className="h-4 w-4" />, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Open' },
  VOTING: { icon: <Scale className="h-4 w-4" />, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: 'Voting' },
  RESOLVED: { icon: <CheckCircle2 className="h-4 w-4" />, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Resolved' },
  APPEALED: { icon: <Clock className="h-4 w-4" />, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Appealed' },
};

const outcomeLabels: Record<string, string> = {
  PENDING: 'Pending',
  CLIENT_WINS: 'Client Wins',
  FREELANCER_WINS: 'Freelancer Wins',
  SPLIT: 'Split Decision',
};

export default function DisputesPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabValue>('');
  const [page, setPage] = useState(1);

  const params: GetDisputesParams = {
    page,
    limit: 20,
    ...(activeTab ? { status: activeTab as GetDisputesParams['status'] } : {}),
  };

  const { data, isLoading } = useDisputes(params);
  const disputes = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const hasNext = data?.hasNext ?? false;
  const hasPrev = data?.hasPrev ?? false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-dt-text">
            <Shield className="h-6 w-6 text-blue-500" />
            Dispute Resolution
          </h1>
          <p className="mt-1 text-dt-text-muted">
            Manage and track contract disputes. {user?.role === 'ADMIN' ? 'As admin, you can review and resolve all disputes.' : 'View disputes related to your contracts.'}
          </p>
        </div>
        <Link
          href="/disputes/history"
          className="shrink-0 rounded-lg border border-dt-border bg-dt-surface px-3 py-2 text-sm font-medium text-dt-text-muted transition hover:bg-dt-surface-alt hover:text-dt-text"
        >
          View History
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-dt-border pb-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setActiveTab(tab.value); setPage(1); }}
            className={cn(
              'whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition',
              activeTab === tab.value
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-dt-text-muted hover:bg-dt-surface-alt'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Disputes List */}
      {isLoading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : disputes.length === 0 ? (
        <Card className="border-dt-border bg-dt-surface">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Shield className="mb-4 h-12 w-12 text-dt-text-muted opacity-40" />
            <h3 className="text-lg font-medium text-dt-text">No disputes found</h3>
            <p className="mt-1 text-sm text-dt-text-muted">
              {activeTab ? `No ${activeTab.toLowerCase()} disputes` : 'No disputes to show'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {disputes.map((dispute: Dispute & { _count?: { votes: number }; contract?: { title?: string; totalAmount?: number; client?: { name?: string | null }; freelancer?: { name?: string | null } } }) => {
            const status = statusConfig[dispute.status] ?? statusConfig.OPEN;
            const contract = dispute.contract;

            return (
              <Link key={dispute.id} href={`/disputes/${dispute.id}`}>
                <Card className="cursor-pointer border-dt-border bg-dt-surface transition hover:border-blue-300 hover:shadow-sm dark:hover:border-blue-700">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-base font-medium text-dt-text">
                            {contract?.title ?? 'Unknown Contract'}
                          </h3>
                          <Badge className={cn('flex items-center gap-1 text-xs', status.color)}>
                            {status.icon}
                            {status.label}
                          </Badge>
                        </div>

                        <p className="mt-1 text-sm text-dt-text-muted">
                          <span className="font-medium">Reason:</span> {dispute.reason}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-dt-text-muted">
                          <span>
                            Initiated by{' '}
                            <span className="font-medium text-dt-text">
                              {dispute.initiator?.name ?? 'Unknown'}
                            </span>
                          </span>
                          <span>•</span>
                          <span>{new Date(dispute.createdAt).toLocaleDateString()}</span>
                          {dispute.status === 'RESOLVED' && dispute.outcome !== 'PENDING' && (
                            <>
                              <span>•</span>
                              <span className="font-medium">{outcomeLabels[dispute.outcome] ?? dispute.outcome}</span>
                            </>
                          )}
                          {(dispute._count?.votes ?? 0) > 0 && (
                            <>
                              <span>•</span>
                              <span>{dispute._count!.votes} vote{dispute._count!.votes !== 1 ? 's' : ''}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Parties */}
                      <div className="hidden text-right text-xs text-dt-text-muted sm:block">
                        <p>Client: {contract?.client?.name ?? '—'}</p>
                        <p>Freelancer: {contract?.freelancer?.name ?? '—'}</p>
                        {contract?.totalAmount && (
                          <p className="mt-1 font-medium text-dt-text">
                            ${Number(contract.totalAmount).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-dt-text-muted">
            Page {page} of {totalPages} ({data?.total ?? 0} disputes)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!hasPrev}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition',
                hasPrev
                  ? 'bg-dt-surface text-dt-text hover:bg-dt-surface-alt'
                  : 'cursor-not-allowed text-dt-text-muted opacity-50'
              )}
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNext}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition',
                hasNext
                  ? 'bg-dt-surface text-dt-text hover:bg-dt-surface-alt'
                  : 'cursor-not-allowed text-dt-text-muted opacity-50'
              )}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Info card */}
      <Card className="border-dt-border bg-dt-surface">
        <CardContent className="flex items-start gap-3 p-4">
          <Scale className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
          <div>
            <p className="text-sm font-medium text-dt-text">Fair Dispute Resolution</p>
            <p className="mt-0.5 text-xs text-dt-text-muted">
              DeTrust uses a hybrid resolution model — disputes can be resolved by admin review or community voting
              where qualified jurors (trust score &gt; 50) cast weighted votes. All outcomes are transparent and permanent.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
