'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  TrendingUp,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useContracts } from '@/hooks/queries/use-contracts';
import { useAdminStats } from '@/hooks/queries/use-admin';
import { cn } from '@/lib/utils';
import type { Contract } from '@/lib/api/contract';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'DISPUTED', label: 'Disputed' },
] as const;

type TabValue = (typeof STATUS_TABS)[number]['value'];

const statusBadge: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  ACTIVE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  DISPUTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function AdminContractsPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('');
  const { data: stats } = useAdminStats();

  const { data, isLoading } = useContracts({
    page: 1,
    limit: 50,
    ...(activeTab ? { status: activeTab as 'ACTIVE' | 'COMPLETED' | 'PENDING' | 'DISPUTED' } : {}),
  });
  const contracts = data?.items ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-dt-text">
          <FileText className="h-6 w-6 text-violet-500" />
          Contract Overview
        </h1>
        <p className="mt-1 text-sm text-dt-text-muted">
          Monitor all platform contracts and escrow activity
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-dt-border bg-dt-surface">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-dt-text-muted">Total Value</p>
              <p className="mt-1 text-2xl font-bold text-violet-600 dark:text-violet-400">
                ${stats.contracts.totalValue.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="border-dt-border bg-dt-surface">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-dt-text-muted">Active</p>
              <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.contracts.active}</p>
            </CardContent>
          </Card>
          <Card className="border-dt-border bg-dt-surface">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-dt-text-muted">Completed</p>
              <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">{stats.contracts.completed}</p>
            </CardContent>
          </Card>
          <Card className="border-dt-border bg-dt-surface">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-dt-text-muted">Avg Value</p>
              <p className="mt-1 text-2xl font-bold text-dt-text">${Math.round(stats.contracts.avgValue).toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
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

      {/* Contracts List */}
      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center"><Spinner size="lg" /></div>
      ) : contracts.length === 0 ? (
        <Card className="border-dt-border bg-dt-surface">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <FileText className="mb-4 h-12 w-12 text-dt-text-muted opacity-40" />
            <h3 className="text-lg font-medium text-dt-text">No contracts found</h3>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {contracts.map((contract: Contract) => (
            <Card key={contract.id} className="border-dt-border bg-dt-surface transition hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-medium text-dt-text">{contract.title}</h3>
                      <Badge className={cn('text-xs', statusBadge[contract.status] ?? 'bg-gray-100 text-gray-600')}>
                        {contract.status}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-dt-text-muted">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        ${Number(contract.totalAmount ?? 0).toLocaleString()}
                      </span>
                      <span>Client: {contract.client?.name ?? '—'}</span>
                      <span>Freelancer: {contract.freelancer?.name ?? '—'}</span>
                      <span>{new Date(contract.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Link href={`/contracts/${contract.id}`}>
                    <Button variant="outline" size="sm" className="text-xs">
                      <ExternalLink className="mr-1 h-3 w-3" /> View
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
