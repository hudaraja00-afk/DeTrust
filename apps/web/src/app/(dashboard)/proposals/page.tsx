'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Eye,
  FileText,
  Shield,
  Sparkles,
  XCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useMyProposals, useWithdrawProposal } from '@/hooks/queries/use-proposals';
import type { GetProposalsParams, ProposalStatus } from '@/lib/api/proposal';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<ProposalStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  SHORTLISTED: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  WITHDRAWN: 'bg-dt-surface-alt text-dt-text-muted',
};

const STATUS_ICONS: Record<ProposalStatus, React.ReactNode> = {
  PENDING: <Clock className="h-4 w-4" />,
  SHORTLISTED: <Sparkles className="h-4 w-4" />,
  ACCEPTED: <CheckCircle2 className="h-4 w-4" />,
  REJECTED: <XCircle className="h-4 w-4" />,
  WITHDRAWN: <XCircle className="h-4 w-4" />,
};

const formatDate = (date: string) => {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString();
};

const TABS: { value: ProposalStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'SHORTLISTED', label: 'Shortlisted' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
];

export default function MyProposalsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<ProposalStatus | ''>('');
  const [page, setPage] = useState(1);

  const params: GetProposalsParams = {
    page,
    limit: 10,
    sort: 'createdAt',
    order: 'desc',
    ...(activeTab ? { status: activeTab } : {}),
  };

  const { data, isLoading } = useMyProposals(params);
  const withdrawMutation = useWithdrawProposal();

  const proposals = data?.items ?? [];
  const pagination = useMemo(() => ({
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    totalPages: data?.totalPages ?? 1,
    hasNext: data?.hasNext ?? false,
    hasPrev: data?.hasPrev ?? false,
  }), [data]);

  useEffect(() => {
    if (user?.role !== 'FREELANCER') {
      toast.error('Only freelancers can access this page');
      router.push('/dashboard');
    }
  }, [user?.role, router]);

  const handleWithdraw = useCallback(async (proposalId: string) => {
    if (!confirm('Are you sure you want to withdraw this proposal?')) return;

    try {
      await withdrawMutation.mutateAsync(proposalId);
      toast.success('Proposal withdrawn');
    } catch {
      toast.error('Failed to withdraw proposal');
    }
  }, [withdrawMutation]);

  if (user?.role !== 'FREELANCER') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dt-text">My Proposals</h1>
          <p className="text-dt-text-muted">Track your submitted proposals and their status</p>
        </div>
        <Button asChild className="bg-emerald-500 text-white hover:bg-emerald-600">
          <Link href="/jobs">Find Jobs</Link>
        </Button>
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

      {/* Proposals List */}
      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : proposals.length === 0 ? (
        <Card className="border-dt-border bg-dt-surface shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-lg font-semibold text-dt-text">
              {activeTab ? `No ${activeTab.toLowerCase()} proposals` : 'No proposals yet'}
            </h3>
            <p className="mt-2 text-dt-text-muted">
              Browse available jobs and submit your first proposal
            </p>
            <Button asChild className="mt-4 bg-emerald-500 text-white hover:bg-emerald-600">
              <Link href="/jobs">Browse Jobs</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => (
            <Card key={proposal.id} className="border-dt-border bg-dt-surface shadow-md">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Job Title and Status */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/jobs/${proposal.jobId}`}
                        className="text-lg font-semibold text-dt-text hover:text-emerald-600"
                      >
                        {proposal.job?.title || 'Job Title'}
                      </Link>
                      <Badge className={cn('flex items-center gap-1', STATUS_COLORS[proposal.status])}>
                        {STATUS_ICONS[proposal.status]}
                        {proposal.status}
                      </Badge>
                    </div>

                    {/* Client Info */}
                    {proposal.job?.client && (
                      <div className="flex flex-wrap items-center gap-4 text-sm text-dt-text-muted">
                        {proposal.job.client.clientProfile?.companyName && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {proposal.job.client.clientProfile.companyName}
                          </span>
                        )}
                        {proposal.job.client.clientProfile?.trustScore !== undefined && (
                          <span className="flex items-center gap-1">
                            <Shield className="h-4 w-4 text-emerald-500" />
                            {proposal.job.client.clientProfile.trustScore}% trust
                          </span>
                        )}
                        {proposal.job.client.clientProfile?.paymentVerified && (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 className="h-4 w-4" />
                            Verified
                          </span>
                        )}
                      </div>
                    )}

                    {/* Proposal Summary */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-dt-text-muted">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        ${proposal.proposedRate}
                        {proposal.job?.type === 'HOURLY' ? '/hr' : ''}
                      </span>
                      {proposal.estimatedDuration && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {proposal.estimatedDuration}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Submitted {formatDate(proposal.createdAt)}
                      </span>
                    </div>

                    {/* Cover Letter Preview */}
                    <p className="line-clamp-2 text-sm text-dt-text-muted">{proposal.coverLetter}</p>

                    {/* Skills */}
                    {proposal.job?.skills && proposal.job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {proposal.job.skills.slice(0, 4).map((js) => (
                          <Badge
                            key={js.id}
                            variant="secondary"
                            className="bg-dt-surface-alt text-xs text-dt-text-muted"
                          >
                            {js.skill.name}
                          </Badge>
                        ))}
                        {proposal.job.skills.length > 4 && (
                          <Badge variant="secondary" className="bg-dt-surface-alt text-xs text-dt-text-muted">
                            +{proposal.job.skills.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Client Note (if rejected) */}
                    {proposal.status === 'REJECTED' && proposal.clientNote && (
                      <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                        <strong>Feedback:</strong> {proposal.clientNote}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className="gap-1 border-dt-border"
                    >
                      <Link href={`/jobs/${proposal.jobId}`}>
                        <Eye className="h-3 w-3" />
                        View Job
                      </Link>
                    </Button>
                    {proposal.status === 'PENDING' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleWithdraw(proposal.id)}
                        className="gap-1 border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="h-3 w-3" />
                        Withdraw
                      </Button>
                    )}
                    {proposal.status === 'ACCEPTED' && (
                      <Button
                        size="sm"
                        asChild
                        className="gap-1 bg-emerald-500 text-white hover:bg-emerald-600"
                      >
                        <Link href={`/contracts`}>View Contract</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-dt-text-muted">
                Showing {(pagination.page - 1) * 10 + 1} to{' '}
                {Math.min(pagination.page * 10, pagination.total)} of {pagination.total} proposals
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrev}
                  onClick={() => setPage((p) => p - 1)}
                  className="border-dt-border"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNext}
                  onClick={() => setPage((p) => p + 1)}
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
