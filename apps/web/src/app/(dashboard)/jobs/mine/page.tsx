'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Eye,
  PenLine,
  Plus,
  Send,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import type { Job, GetJobsParams, JobStatus } from '@/lib/api/job';
import { useMyJobs, usePublishJob, useCancelJob, useDeleteJob } from '@/hooks/queries/use-jobs';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<JobStatus, string> = {
  DRAFT: 'bg-dt-surface-alt text-dt-text-muted',
  OPEN: 'bg-emerald-100 text-emerald-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  DISPUTED: 'bg-amber-100 text-amber-700',
};

const formatBudget = (job: Job) => {
  if (job.type === 'FIXED_PRICE') {
    return job.budget ? `$${Number(job.budget).toLocaleString()}` : 'Budget TBD';
  }
  if (job.hourlyRateMin && job.hourlyRateMax) {
    return `$${Number(job.hourlyRateMin)} - $${Number(job.hourlyRateMax)}/hr`;
  }
  return 'Rate TBD';
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

const TABS: { value: JobStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'DRAFT', label: 'Drafts' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function MyJobsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<JobStatus | ''>('');
  const [page, setPage] = useState(1);

  const params: GetJobsParams = {
    page,
    limit: 10,
    sort: 'createdAt',
    order: 'desc',
    ...(activeTab ? { status: activeTab } : {}),
  };

  const { data, isLoading } = useMyJobs(params);

  const jobs = data?.items ?? [];
  const pagination = useMemo(() => ({
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    totalPages: data?.totalPages ?? 1,
    hasNext: data?.hasNext ?? false,
    hasPrev: data?.hasPrev ?? false,
  }), [data]);

  const publishJob = usePublishJob();
  const cancelJob = useCancelJob();
  const deleteJob = useDeleteJob();

  useEffect(() => {
    if (user?.role !== 'CLIENT') {
      toast.error('Only clients can access this page');
      router.push('/dashboard');
    }
  }, [user?.role, router]);

  const handlePublish = useCallback(async (jobId: string) => {
    try {
      await publishJob.mutateAsync(jobId);
      toast.success('Job published successfully!');
    } catch {
      toast.error('Failed to publish job');
    }
  }, [publishJob]);

  const handleCancel = useCallback(async (jobId: string) => {
    if (!confirm('Are you sure you want to cancel this job?')) return;

    try {
      await cancelJob.mutateAsync(jobId);
      toast.success('Job cancelled');
    } catch {
      toast.error('Failed to cancel job');
    }
  }, [cancelJob]);

  const handleDelete = useCallback(async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this draft?')) return;

    try {
      await deleteJob.mutateAsync(jobId);
      toast.success('Draft deleted');
    } catch {
      toast.error('Failed to delete draft');
    }
  }, [deleteJob]);

  if (user?.role !== 'CLIENT') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dt-text">My Jobs</h1>
          <p className="text-dt-text-muted">Manage your job postings and review proposals</p>
        </div>
        <Button asChild className="gap-2 bg-emerald-500 text-white hover:bg-emerald-600">
          <Link href="/jobs/new">
            <Plus className="h-4 w-4" />
            Post New Job
          </Link>
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

      {/* Job Listings */}
      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : jobs.length === 0 ? (
        <Card className="border-dt-border bg-dt-surface shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Briefcase className="h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-lg font-semibold text-dt-text">
              {activeTab ? `No ${activeTab.toLowerCase().replace('_', ' ')} jobs` : 'No jobs yet'}
            </h3>
            <p className="mt-2 text-dt-text-muted">
              {activeTab === 'DRAFT'
                ? 'You have no draft jobs'
                : 'Post your first job to start finding talent'}
            </p>
            <Button asChild className="mt-4 bg-emerald-500 text-white hover:bg-emerald-600">
              <Link href="/jobs/new">Post a Job</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id} className="border-dt-border bg-dt-surface shadow-md">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    {/* Title and Status */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="text-lg font-semibold text-dt-text hover:text-emerald-600"
                      >
                        {job.title}
                      </Link>
                      <Badge className={STATUS_COLORS[job.status]}>
                        {job.status.replace('_', ' ')}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          job.type === 'FIXED_PRICE'
                            ? 'border-blue-200 text-blue-700'
                            : 'border-purple-200 text-purple-700'
                        )}
                      >
                        {job.type === 'FIXED_PRICE' ? 'Fixed' : 'Hourly'}
                      </Badge>
                    </div>

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-dt-text-muted">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {formatBudget(job)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {job._count?.proposals || job.proposalCount || 0} proposals
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {job.viewCount || 0} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDate(job.createdAt)}
                      </span>
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1">
                      {job.skills.slice(0, 4).map((js) => (
                        <Badge
                          key={js.id}
                          variant="secondary"
                          className="bg-dt-surface-alt text-xs text-dt-text-muted"
                        >
                          {js.skill.name}
                        </Badge>
                      ))}
                      {job.skills.length > 4 && (
                        <Badge variant="secondary" className="bg-dt-surface-alt text-xs text-dt-text-muted">
                          +{job.skills.length - 4}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {job.status === 'DRAFT' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handlePublish(job.id)}
                          className="gap-1 bg-emerald-500 text-white hover:bg-emerald-600"
                        >
                          <Send className="h-3 w-3" />
                          Publish
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          className="gap-1 border-dt-border"
                        >
                          <Link href={`/jobs/${job.id}/edit`}>
                            <PenLine className="h-3 w-3" />
                            Edit
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(job.id)}
                          className="gap-1 border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    {job.status === 'OPEN' && (
                      <>
                        <Button
                          size="sm"
                          asChild
                          className="gap-1 bg-emerald-500 text-white hover:bg-emerald-600"
                        >
                          <Link href={`/jobs/${job.id}/proposals`}>
                            <Users className="h-3 w-3" />
                            Proposals ({job._count?.proposals || job.proposalCount || 0})
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancel(job.id)}
                          className="gap-1 border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-3 w-3" />
                          Cancel
                        </Button>
                      </>
                    )}
                    {job.status === 'IN_PROGRESS' && (
                      <Button
                        size="sm"
                        asChild
                        className="gap-1 bg-blue-500 text-white hover:bg-blue-600"
                      >
                        <Link href={`/contracts/${job.id}`}>View Contract</Link>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      asChild
                      className="text-dt-text-muted"
                    >
                      <Link href={`/jobs/${job.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
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
                {Math.min(pagination.page * 10, pagination.total)} of {pagination.total} jobs
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrev}
                  onClick={() => setPage(page - 1)}
                  className="border-dt-border"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNext}
                  onClick={() => setPage(page + 1)}
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
