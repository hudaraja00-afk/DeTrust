'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, BarChart3, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { AcceptProposalForm } from '@/components/proposals/accept-proposal-form';
import { ProposalCard } from '@/components/proposals/proposal-card';
import { ProposalComparison } from '@/components/proposals/proposal-comparison';
import type { MilestoneFormItem } from '@/components/proposals/accept-proposal-form';
import { useJob } from '@/hooks/queries/use-jobs';
import { useJobProposals, useAcceptProposal, useRejectProposal, useShortlistProposal } from '@/hooks/queries/use-proposals';
import type { GetProposalsParams } from '@/lib/api/proposal';
import { useAuthStore } from '@/store/auth.store';

export default function JobProposalsPage() {
  const { id: jobId } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const [acceptingProposal, setAcceptingProposal] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  const { data: job } = useJob(jobId);
  const qp: GetProposalsParams = { page, limit: 10, sort: 'createdAt', order: 'desc' };
  const { data: pd, isLoading } = useJobProposals(jobId, qp);
  const acceptMut = useAcceptProposal();
  const rejectMut = useRejectProposal();
  const shortlistMut = useShortlistProposal();

  const proposals = pd?.items ?? [];
  const pg = { total: pd?.total ?? 0, page: pd?.page ?? 1, totalPages: pd?.totalPages ?? 1, hasNext: pd?.hasNext ?? false, hasPrev: pd?.hasPrev ?? false };
  const actionLoading = acceptMut.isPending ? (acceptMut.variables?.id ?? null)
    : rejectMut.isPending ? (rejectMut.variables?.id ?? null)
    : shortlistMut.isPending ? (shortlistMut.variables ?? null) : null;

  useEffect(() => {
    if (user?.role !== 'CLIENT') { toast.error('Only clients can access this page'); router.push('/jobs'); }
  }, [user?.role, router]);

  const handleShortlist = (id: string) => shortlistMut.mutate(id, {
    onSuccess: (r) => r.success ? toast.success('Proposal shortlisted') : toast.error(r.error?.message || 'Failed'),
    onError: () => toast.error('Failed to shortlist proposal'),
  });

  const handleReject = (id: string) => {
    if (!confirm('Are you sure you want to reject this proposal?')) return;
    rejectMut.mutate({ id }, {
      onSuccess: (r) => r.success ? toast.success('Proposal rejected') : toast.error(r.error?.message || 'Failed'),
      onError: () => toast.error('Failed to reject proposal'),
    });
  };

  const handleAccept = (id: string, milestones: MilestoneFormItem[]) => {
    if (milestones.length === 0 || milestones.some((m) => !m.title || m.amount <= 0)) { toast.error('Please add at least one valid milestone'); return; }
    acceptMut.mutate({ id, data: { milestones: milestones.map((m) => ({ title: m.title, description: m.description, amount: m.amount, dueDate: m.dueDate ? new Date(m.dueDate).toISOString() : undefined })) } }, {
      onSuccess: (r) => { if (r.success && r.data?.contract?.id) { toast.success('Proposal accepted! Redirecting to fund escrow...'); router.push(`/contracts/${r.data.contract.id}?autoFund=true`); } else if (r.success) { toast.success('Proposal accepted! Contract created.'); router.push('/contracts'); } else { toast.error(r.error?.message || 'Failed'); } setAcceptingProposal(null); },
      onError: () => { toast.error('Failed to accept proposal'); setAcceptingProposal(null); },
    });
  };

  const handleAcceptHourly = (id: string, weeklyHourLimit: number, durationWeeks: number) => {
    acceptMut.mutate({ id, data: { weeklyHourLimit, durationWeeks } }, {
      onSuccess: (r) => { if (r.success && r.data?.contract?.id) { toast.success('Hourly contract created! Redirecting to fund escrow...'); router.push(`/contracts/${r.data.contract.id}?autoFund=true`); } else if (r.success) { toast.success('Hourly contract created!'); router.push('/contracts'); } else { toast.error(r.error?.message || 'Failed'); } setAcceptingProposal(null); },
      onError: () => { toast.error('Failed to create hourly contract'); setAcceptingProposal(null); },
    });
  };

  if (user?.role !== 'CLIENT') return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2 text-dt-text-muted hover:text-dt-text"><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-semibold text-dt-text">Proposals for: {job?.title || 'Loading...'}</h1>
          <p className="text-dt-text-muted">{pg.total} proposal{pg.total !== 1 ? 's' : ''} received</p>
        </div>
        {proposals.length >= 2 && (
          <Button variant="outline" size="sm" onClick={() => setShowComparison(!showComparison)} className="ml-auto gap-1 border-dt-border">
            <BarChart3 className="h-4 w-4" />{showComparison ? 'Hide' : 'Compare'}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center"><Spinner size="lg" /></div>
      ) : proposals.length === 0 ? (
        <Card className="border-dt-border bg-dt-surface shadow-lg"><CardContent className="flex flex-col items-center justify-center py-16">
          <Users className="h-12 w-12 text-slate-300" /><h3 className="mt-4 text-lg font-semibold text-dt-text">No proposals yet</h3>
          <p className="mt-2 text-dt-text-muted">Proposals will appear here when freelancers apply</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {showComparison && proposals.length >= 2 && (
            <ProposalComparison proposals={proposals} onClose={() => setShowComparison(false)} />
          )}
          {proposals.map((p) => (
            <ProposalCard key={p.id} proposal={p} jobType={job?.type} actionLoading={actionLoading} isAccepting={acceptingProposal === p.id} onStartAccept={setAcceptingProposal} onShortlist={handleShortlist} onReject={handleReject}>
              <AcceptProposalForm isLoading={actionLoading === p.id} jobType={job?.type} proposedRate={p.proposedRate} onConfirm={(ms) => handleAccept(p.id, ms)} onConfirmHourly={(whl, dw) => handleAcceptHourly(p.id, whl, dw)} onCancel={() => setAcceptingProposal(null)} />
            </ProposalCard>
          ))}
          {pg.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-dt-text-muted">Showing {(pg.page - 1) * 10 + 1} to {Math.min(pg.page * 10, pg.total)} of {pg.total} proposals</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={!pg.hasPrev} onClick={() => setPage(pg.page - 1)} className="border-dt-border"><ChevronLeft className="h-4 w-4" /> Previous</Button>
                <Button variant="outline" size="sm" disabled={!pg.hasNext} onClick={() => setPage(pg.page + 1)} className="border-dt-border">Next <ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
