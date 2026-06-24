'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  CheckCircle2,
  Scale,
  Search,
  Calendar,
  Filter,
  ArrowLeft,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import type { Dispute } from '@detrust/types';
import { useDisputes } from '@/hooks/queries/use-disputes';
import { cn } from '@/lib/utils';
import type { GetDisputesParams } from '@/lib/api/dispute';

const OUTCOME_TABS = [
  { value: '', label: 'All Outcomes' },
  { value: 'CLIENT_WINS', label: 'Client Wins' },
  { value: 'FREELANCER_WINS', label: 'Freelancer Wins' },
  { value: 'SPLIT', label: 'Split' },
] as const;

type OutcomeTab = (typeof OUTCOME_TABS)[number]['value'];

const outcomeConfig: Record<string, { color: string; label: string }> = {
  CLIENT_WINS: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: 'Client Wins' },
  FREELANCER_WINS: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Freelancer Wins' },
  SPLIT: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', label: 'Split' },
  PENDING: { color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', label: 'Pending' },
};

export default function DisputeHistoryPage() {
  const [outcomeTab, setOutcomeTab] = useState<OutcomeTab>('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const params: GetDisputesParams = {
    status: 'RESOLVED',
    page,
    limit: 20,
    sort: 'resolvedAt',
    order: 'desc',
    ...(outcomeTab ? { outcome: outcomeTab as GetDisputesParams['outcome'] } : {}),
    ...(search ? { search } : {}),
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
  };

  const { data, isLoading } = useDisputes(params);
  const disputes = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const hasNext = data?.hasNext ?? false;
  const hasPrev = data?.hasPrev ?? false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/disputes"
          className="mb-3 flex items-center gap-1 text-sm text-dt-text-muted hover:text-dt-text"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Active Disputes
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-dt-text">
          <Shield className="h-6 w-6 text-green-500" />
          Dispute History &amp; Archive
        </h1>
        <p className="mt-1 text-dt-text-muted">
          Browse resolved disputes with full details, outcomes, and filtering.
        </p>
      </div>

      {/* Filters Bar */}
      <Card className="border-dt-border bg-dt-surface">
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          {/* Search */}
          <div className="min-w-[200px] flex-1">
            <label htmlFor="dispute-search" className="mb-1 block text-xs font-medium text-dt-text-muted">
              <Search className="mr-1 inline h-3 w-3" /> Search
            </label>
            <Input
              id="dispute-search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by reason or description…"
              className="h-9 text-sm"
            />
          </div>

          {/* Date From */}
          <div className="w-40">
            <label htmlFor="date-from" className="mb-1 block text-xs font-medium text-dt-text-muted">
              <Calendar className="mr-1 inline h-3 w-3" /> From
            </label>
            <Input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="h-9 text-sm"
            />
          </div>

          {/* Date To */}
          <div className="w-40">
            <label htmlFor="date-to" className="mb-1 block text-xs font-medium text-dt-text-muted">
              <Calendar className="mr-1 inline h-3 w-3" /> To
            </label>
            <Input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="h-9 text-sm"
            />
          </div>

          {/* Clear Filters */}
          {(search || dateFrom || dateTo || outcomeTab) && (
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => {
                setSearch('');
                setDateFrom('');
                setDateTo('');
                setOutcomeTab('');
                setPage(1);
              }}
            >
              <Filter className="mr-1 h-3 w-3" /> Clear
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Outcome Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-dt-border pb-2">
        {OUTCOME_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setOutcomeTab(tab.value); setPage(1); }}
            className={cn(
              'whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition',
              outcomeTab === tab.value
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-dt-text-muted hover:bg-dt-surface-alt',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : disputes.length === 0 ? (
        <Card className="border-dt-border bg-dt-surface">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <CheckCircle2 className="mb-4 h-12 w-12 text-dt-text-muted opacity-40" />
            <h3 className="text-lg font-medium text-dt-text">No resolved disputes found</h3>
            <p className="mt-1 text-sm text-dt-text-muted">
              {search || dateFrom || dateTo || outcomeTab
                ? 'Try adjusting your filters'
                : 'Resolved disputes will appear here'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {disputes.map((dispute: Dispute) => {
            const contract = dispute.contract as any;
            const outcome = outcomeConfig[dispute.outcome] ?? outcomeConfig.PENDING;
            const voteCount = (dispute as any)._count?.votes as number | undefined;

            return (
              <Link key={dispute.id} href={`/disputes/${dispute.id}`}>
                <Card className="border-dt-border bg-dt-surface transition hover:border-green-300 hover:shadow-sm dark:hover:border-green-700">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-medium text-dt-text">
                          {contract?.title ?? 'Unknown Contract'}
                        </h3>
                        <Badge className={cn('text-xs', outcome.color)}>
                          {outcome.label}
                        </Badge>
                      </div>
                      <p className="mt-1 truncate text-xs text-dt-text-muted">
                        {dispute.reason}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-dt-text-muted">
                        <span>Filed: {new Date(dispute.createdAt).toLocaleDateString()}</span>
                        {dispute.resolvedAt && (
                          <span>Resolved: {new Date(dispute.resolvedAt).toLocaleDateString()}</span>
                        )}
                        <span>
                          Value: ${contract?.totalAmount ? Number(contract.totalAmount).toLocaleString() : '—'}
                        </span>
                        {voteCount !== undefined && (
                          <span className="flex items-center gap-1">
                            <Scale className="h-3 w-3" /> {voteCount} vote{voteCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col items-end gap-1 text-xs text-dt-text-muted">
                      <span>{contract?.client?.name ?? 'Client'}</span>
                      <span className="text-dt-text-muted/60">vs</span>
                      <span>{contract?.freelancer?.name ?? 'Freelancer'}</span>
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
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-dt-text-muted">
            Page {page} of {totalPages} · {data?.total ?? 0} dispute{(data?.total ?? 0) !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!hasPrev}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNext}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
