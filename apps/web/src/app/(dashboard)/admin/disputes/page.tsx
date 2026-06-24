'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  AlertTriangle,
  Scale,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useDisputes } from '@/hooks/queries/use-disputes';
import { useAdminStats } from '@/hooks/queries/use-admin';
import { cn } from '@/lib/utils';
import type { GetDisputesParams } from '@/lib/api/dispute';

interface DisputeListItem {
  id: string;
  status: string;
  reason: string;
  createdAt: string | Date;
  contract?: { id: string; title: string };
  initiator?: { id: string; name: string | null };
  _count?: { votes: number };
}

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'OPEN', label: 'Open' },
  { value: 'VOTING', label: 'Voting' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'APPEALED', label: 'Appealed' },
] as const;

type TabValue = (typeof STATUS_TABS)[number]['value'];

const statusConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  OPEN: { icon: <AlertTriangle className="h-4 w-4" />, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  VOTING: { icon: <Scale className="h-4 w-4" />, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  RESOLVED: { icon: <CheckCircle2 className="h-4 w-4" />, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  APPEALED: { icon: <Clock className="h-4 w-4" />, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

export default function AdminDisputesPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('');
  const { data: stats } = useAdminStats();

  const params: GetDisputesParams = {
    page: 1,
    limit: 50,
    ...(activeTab ? { status: activeTab as GetDisputesParams['status'] } : {}),
  };

  const { data, isLoading } = useDisputes(params);
  const disputes = data?.items ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-dt-text">
          <Shield className="h-6 w-6 text-amber-500" />
          Dispute Monitoring
        </h1>
        <p className="mt-1 text-sm text-dt-text-muted">
          Monitor and resolve all platform disputes
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-dt-border bg-dt-surface">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-dt-text-muted">Open</p>
              <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.disputes.open}</p>
            </CardContent>
          </Card>
          <Card className="border-dt-border bg-dt-surface">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-dt-text-muted">Voting</p>
              <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.disputes.voting}</p>
            </CardContent>
          </Card>
          <Card className="border-dt-border bg-dt-surface">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-dt-text-muted">Resolved</p>
              <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">{stats.disputes.resolved}</p>
            </CardContent>
          </Card>
          <Card className="border-dt-border bg-dt-surface">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-dt-text-muted">Total</p>
              <p className="mt-1 text-2xl font-bold text-dt-text">{stats.disputes.total}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-dt-border pb-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
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
        <div className="flex min-h-[300px] items-center justify-center"><Spinner size="lg" /></div>
      ) : disputes.length === 0 ? (
        <Card className="border-dt-border bg-dt-surface">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Shield className="mb-4 h-12 w-12 text-dt-text-muted opacity-40" />
            <h3 className="text-lg font-medium text-dt-text">No disputes found</h3>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {disputes.map((dispute) => {
            const d = dispute as DisputeListItem;
            const status = statusConfig[d.status] ?? statusConfig.OPEN;
            const contract = d.contract;
            return (
              <Card key={d.id} className="border-dt-border bg-dt-surface transition hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-medium text-dt-text">
                          {contract?.title ?? 'Unknown Contract'}
                        </h3>
                        <Badge className={cn('flex items-center gap-1 text-xs', status.color)}>
                          {status.icon} {d.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-dt-text-muted">
                        <span className="font-medium">Reason:</span> {d.reason}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-dt-text-muted">
                        <span>By {d.initiator?.name ?? 'Unknown'}</span>
                        <span>•</span>
                        <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                        {d._count?.votes && d._count.votes > 0 && (
                          <>
                            <span>•</span>
                            <span>{d._count.votes} vote{d._count.votes !== 1 ? 's' : ''}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Link href={`/disputes/${d.id}`}>
                      <Button variant="outline" size="sm" className="text-xs">
                        <ExternalLink className="mr-1 h-3 w-3" /> Review
                      </Button>
                    </Link>
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
