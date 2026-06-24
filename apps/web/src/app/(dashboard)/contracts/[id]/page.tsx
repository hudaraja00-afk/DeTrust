'use client';

import { useCallback, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, XCircle, MessageSquareText, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useAuthStore } from '@/store/auth.store';
import { useJobEscrow } from '@/hooks/use-job-escrow';
import { useSecureObjectUrl } from '@/hooks/use-secure-object-url';
import { ContractHeader } from '@/components/contracts/contract-header';
import { ContractSidebar } from '@/components/contracts/contract-sidebar';
import { EscrowFunding } from '@/components/contracts/escrow-funding';
import { MilestoneList } from '@/components/contracts/milestone-list';
import { MilestoneTimeline } from '@/components/contracts/milestone-timeline';
import { DisputeForm } from '@/components/contracts/dispute-form';
import { ReviewForm } from '@/components/reviews/review-form';
import { ReviewList } from '@/components/reviews/review-list';
import { useContract, useRaiseDispute } from '@/hooks/queries/use-contracts';
import { useContractReviews, useReviewStatus } from '@/hooks/queries/use-reviews';

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoFund = searchParams.get('autoFund') === 'true';
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const contractId = params.id as string;
  const { approveMilestone: approveOnChain } = useJobEscrow();

  const { data: contract, isLoading: loading, refetch } = useContract(contractId);
  const raiseDisputeMutation = useRaiseDispute();
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const isCompleted = contract?.status === 'COMPLETED';

  const { data: contractReviewsData, refetch: refetchReviews } = useContractReviews(
    isCompleted ? contractId : ''
  );
  const { data: reviewStatusData } = useReviewStatus(
    isCompleted ? contractId : ''
  );

  const isClient = user?.role === 'CLIENT';
  const isFreelancer = user?.role === 'FREELANCER';
  const isOwner = contract?.clientId === user?.id || contract?.freelancerId === user?.id;

  const { objectUrl: secureClientAvatar } = useSecureObjectUrl(contract?.client?.avatarUrl);
  const { objectUrl: secureFreelancerAvatar } = useSecureObjectUrl(contract?.freelancer?.avatarUrl);

  const otherParty = useMemo(() => isClient
    ? {
        name: contract?.freelancer?.name || 'Freelancer',
        avatar: secureFreelancerAvatar,
        subtitle: contract?.freelancer?.freelancerProfile?.title || 'Freelancer',
        trustScore: contract?.freelancer?.freelancerProfile?.trustScore || 0,
      }
    : {
        name: contract?.client?.name || 'Client',
        avatar: secureClientAvatar,
        subtitle: contract?.client?.clientProfile?.companyName || 'Client',
        trustScore: contract?.client?.clientProfile?.trustScore || 0,
      }, [isClient, contract, secureClientAvatar, secureFreelancerAvatar]);

  const handleRaiseDispute = useCallback(() => {
    setShowDisputeForm(true);
  }, []);

  const handleSubmitDispute = useCallback(async (reason: string, evidence: string[]) => {
    try {
      const response = await raiseDisputeMutation.mutateAsync({ contractId, reason, evidence });
      if (response.success) {
        toast.success('Dispute raised. Our team will review it.');
        setShowDisputeForm(false);
      } else {
        toast.error(response.error?.message || 'Failed to raise dispute');
      }
    } catch {
      toast.error('Failed to raise dispute');
    }
  }, [raiseDisputeMutation, contractId]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!contract || !isOwner) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <XCircle className="h-12 w-12 text-slate-300" />
        <h3 className="mt-4 text-lg font-semibold text-dt-text">Contract not found</h3>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/contracts">Back to Contracts</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="gap-2 text-dt-text-muted hover:text-dt-text"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="grid gap-6 lg:grid-cols-[1fr,380px]">
        <div className="space-y-6">
          <ContractHeader contract={contract} otherParty={otherParty} />
          {contract.status === 'PENDING' && isClient && (
            <EscrowFunding contract={contract} onFunded={() => { refetch(); }} autoFund={autoFund} />
          )}
          <MilestoneTimeline milestones={contract.milestones} />
          {contract.status === 'DISPUTED' && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <div>
                <p className="font-medium text-red-700 dark:text-red-400">Contract Under Dispute</p>
                <p className="mt-1 text-sm text-red-600 dark:text-red-500">
                  This contract has an active dispute. Milestone submissions and payments are frozen
                  until the dispute is resolved. Visit the{' '}
                  <Link href="/disputes" className="underline hover:text-red-700">
                    Disputes page
                  </Link>{' '}
                  for details.
                </p>
              </div>
            </div>
          )}
          {showDisputeForm && (
            <DisputeForm
              onSubmit={handleSubmitDispute}
              onCancel={() => setShowDisputeForm(false)}
              loading={raiseDisputeMutation.isPending}
            />
          )}
          <MilestoneList
            contract={contract}
            isClient={!!isClient}
            isFreelancer={!!isFreelancer}
            isAuthenticated={isAuthenticated}
            onApproveOnChain={async (jobId, idx) => { await approveOnChain(jobId, idx); }}
            onRefresh={() => { refetch(); }}
          />

          {/* Reviews & Feedback Section */}
          {isCompleted && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-dt-text">
                  <MessageSquareText className="h-5 w-5 text-emerald-500" />
                  Reviews & Feedback
                </h2>
                {!reviewStatusData?.hasReviewed && !showReviewForm && (
                  <Button
                    onClick={() => setShowReviewForm(true)}
                    className="bg-emerald-500 text-white hover:bg-emerald-600"
                    size="sm"
                  >
                    Write Review
                  </Button>
                )}
              </div>

              {showReviewForm && !reviewStatusData?.hasReviewed && (
                <ReviewForm
                  contractId={contractId}
                  contractTitle={contract.title}
                  subjectName={otherParty.name}
                  isClient={!!isClient}
                  onSuccess={() => {
                    setShowReviewForm(false);
                    refetchReviews();
                  }}
                  onCancel={() => setShowReviewForm(false)}
                />
              )}

              {reviewStatusData?.hasReviewed && !showReviewForm && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                  ✓ You have submitted your review for this contract.
                </div>
              )}

              <ReviewList
                reviews={contractReviewsData?.items ?? []}
                emptyMessage="No reviews submitted yet for this contract."
              />
            </div>
          )}
        </div>

        <ContractSidebar
          contract={contract}
          isClient={!!isClient}
          onRaiseDispute={handleRaiseDispute}
          actionLoading={raiseDisputeMutation.isPending}
        />
      </div>
    </div>
  );
}
