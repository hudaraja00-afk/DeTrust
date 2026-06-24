'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { CreateProposalInput } from '@/lib/api/proposal';
import { useAuthStore } from '@/store/auth.store';
import { useSecureObjectUrl } from '@/hooks/use-secure-object-url';
import { useJob } from '@/hooks/queries/use-jobs';
import { useCreateProposal } from '@/hooks/queries/use-proposals';
import { JobDescriptionCard } from '@/components/jobs/job-description-card';
import { JobDetailHeader } from '@/components/jobs/job-detail-header';
import { JobSidebar } from '@/components/jobs/job-sidebar';
import { ProposalForm } from '@/components/jobs/proposal-form';

export default function JobDetailPage() {
  const { id: jobId } = useParams() as { id: string };
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: job, isLoading, error } = useJob(jobId);
  const createProposal = useCreateProposal();
  const { objectUrl: clientAvatarUrl } = useSecureObjectUrl(job?.client?.avatarUrl);

  const isFreelancer = user?.role === 'FREELANCER';
  const isOwner = job?.clientId === user?.id;
  const hasSubmittedProposal = !!(job?.proposals?.length);
  const defaultRate =
    job?.type === 'FIXED_PRICE' && job.budget ? Number(job.budget) : Number(job?.hourlyRateMin ?? 0);

  useEffect(() => {
    if (error) { toast.error('Job not found'); router.push('/jobs'); }
  }, [error, router]);

  const handleSubmitProposal = async (data: CreateProposalInput) => {
    try {
      const res = await createProposal.mutateAsync({ jobId, data });
      if (res.success) toast.success('Proposal submitted successfully!');
      else toast.error(res.error?.message || 'Failed to submit proposal');
    } catch {
      toast.error('Failed to submit proposal');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <XCircle className="h-12 w-12 text-slate-300" />
        <h3 className="mt-4 text-lg font-semibold text-dt-text">Job not found</h3>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/jobs">Back to Jobs</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="gap-2 text-dt-text-muted hover:text-dt-text">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <div className="grid gap-6 lg:grid-cols-[1fr,380px]">
        <div className="space-y-6">
          <JobDetailHeader job={job} />
          <JobDescriptionCard job={job} />
          {isFreelancer && (
            <ProposalForm
              job={job} jobId={jobId} hasSubmittedProposal={hasSubmittedProposal}
              onSubmit={handleSubmitProposal} submitting={createProposal.isPending}
              defaultRate={defaultRate}
            />
          )}
        </div>
        <JobSidebar job={job} clientAvatarUrl={clientAvatarUrl} isOwner={isOwner} />
      </div>
    </div>
  );
}
