'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileCheck,
  Shield,
} from 'lucide-react';

import { SecureAvatar } from '@/components/secure-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import type { Contract, ContractStatus, GetContractsParams } from '@/lib/api/contract';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import { useContracts } from '@/hooks/queries/use-contracts';

const STATUS_COLORS: Record<ContractStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  ACTIVE: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
  DISPUTED: 'bg-orange-100 text-orange-700',
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const TABS: { value: ContractStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'DISPUTED', label: 'Disputed' },
];

export default function ContractsPage() {
  const { user } = useAuthStore();
  const isClient = user?.role === 'CLIENT';

  const [activeTab, setActiveTab] = useState<ContractStatus | ''>('');
  const [page, setPage] = useState(1);

  const params: GetContractsParams = {
    page,
    limit: 10,
    sort: 'createdAt',
    order: 'desc',
    role: isClient ? 'client' : 'freelancer',
    ...(activeTab ? { status: activeTab } : {}),
  };

  const { data, isLoading } = useContracts(params);
  const contracts = data?.items ?? [];
  const pagination = useMemo(() => ({
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    totalPages: data?.totalPages ?? 1,
    hasNext: data?.hasNext ?? false,
    hasPrev: data?.hasPrev ?? false,
  }), [data]);

  const getOtherParty = useCallback((contract: Contract) => {
    if (isClient) {
      return {
        name: contract.freelancer?.name || 'Freelancer',
        avatar: contract.freelancer?.avatarUrl,
        subtitle: contract.freelancer?.freelancerProfile?.title || 'Freelancer',
        trustScore: contract.freelancer?.freelancerProfile?.trustScore || 0,
      };
    }
    return {
      name: contract.client?.name || 'Client',
      avatar: contract.client?.avatarUrl,
      subtitle: contract.client?.clientProfile?.companyName || 'Client',
      trustScore: contract.client?.clientProfile?.trustScore || 0,
    };
  }, [isClient]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dt-text">Active Contracts</h1>
          <p className="text-dt-text-muted">
            {isClient ? 'Manage your contracts with freelancers' : 'Track your ongoing contracts'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-dt-border pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setActiveTab(tab.value);
              setPage(1);
            }}
            className={cn(
              'whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition',
              activeTab === tab.value
                ? 'bg-slate-900 text-white'
                : 'text-dt-text-muted hover:bg-dt-surface-alt'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contracts List */}
      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : contracts.length === 0 ? (
        <Card className="border-dt-border bg-dt-surface shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Briefcase className="h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-lg font-semibold text-dt-text">
              {activeTab ? `No ${activeTab.toLowerCase()} contracts` : 'No contracts yet'}
            </h3>
            <p className="mt-2 text-dt-text-muted">
              {isClient
                ? 'Accept a proposal to create a contract'
                : 'Get your proposals accepted to start contracts'}
            </p>
            <Button
              asChild
              className="mt-4 bg-emerald-500 text-white hover:bg-emerald-600"
            >
              <Link href={isClient ? '/jobs/mine' : '/jobs'}>
                {isClient ? 'View My Jobs' : 'Find Jobs'}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {contracts.map((contract) => {
            const otherParty = getOtherParty(contract);
            const completedMilestones = contract.milestones?.filter(m => m.status === 'PAID' || m.status === 'APPROVED').length || 0;
            const totalMilestones = contract.milestones?.length || 0;
            const progress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

            return (
              <Link key={contract.id} href={`/contracts/${contract.id}`}>
                <Card className="border-dt-border bg-dt-surface shadow-md transition-all hover:border-emerald-200 hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      {/* Contract Info */}
                      <div className="flex items-start gap-4">
                        <SecureAvatar
                          src={otherParty.avatar}
                          alt={otherParty.name}
                          size={56}
                          fallbackInitial={otherParty.name[0]?.toUpperCase() ?? 'U'}
                          containerClassName="h-14 w-14 overflow-hidden rounded-full border-2 border-emerald-100 bg-dt-surface-alt"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-dt-text">
                              {contract.title}
                            </h3>
                            <Badge className={STATUS_COLORS[contract.status as ContractStatus]}>
                              {contract.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-dt-text-muted">
                            with {otherParty.name} · {otherParty.subtitle}
                          </p>
                          <div className="mt-1 flex items-center gap-3 text-sm text-dt-text-muted">
                            <span className="flex items-center gap-1">
                              <Shield className="h-4 w-4 text-emerald-500" />
                              {otherParty.trustScore}% trust
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Started {formatDate(contract.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Amount & Progress */}
                      <div className="text-right">
                        <div className="text-xl font-semibold text-dt-text">
                          ${Number(contract.totalAmount).toLocaleString()}
                        </div>
                        <div className="text-sm text-dt-text-muted">
                          ${Number(contract.paidAmount ?? 0).toLocaleString()} paid
                        </div>
                      </div>
                    </div>

                    {/* Milestone Progress */}
                    {totalMilestones > 0 && (
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1 text-dt-text-muted">
                            <FileCheck className="h-4 w-4" />
                            Milestones
                          </span>
                          <span className="font-medium text-dt-text">
                            {completedMilestones} / {totalMilestones} completed
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-dt-surface-alt">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Escrow Status */}
                    {contract.escrowAddress && (
                      <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="text-emerald-700">Escrow funded on-chain</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-dt-text-muted">
                Showing {(pagination.page - 1) * 10 + 1} to{' '}
                {Math.min(pagination.page * 10, pagination.total)} of {pagination.total} contracts
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrev}
                  onClick={() => setPage(pagination.page - 1)}
                  className="border-dt-border"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNext}
                  onClick={() => setPage(pagination.page + 1)}
                  className="border-dt-border"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
