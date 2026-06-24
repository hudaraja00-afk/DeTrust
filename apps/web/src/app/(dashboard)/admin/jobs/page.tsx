'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Search,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  FileText,
  Users,
  ExternalLink,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useAdminJobs } from '@/hooks/queries/use-admin';
import { cn } from '@/lib/utils';
import type { AdminJob, AdminJobListParams } from '@/lib/api/admin';

const JOB_STATUS_OPTIONS = ['', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED'] as const;

const statusBadge: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  OPEN: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  DISPUTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function AdminJobsPage() {
  const [params, setParams] = useState<AdminJobListParams>({ page: 1, limit: 20 });
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const queryParams = {
    ...params,
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  const { data, isLoading } = useAdminJobs(queryParams);
  const jobs = data?.items ?? [];

  const handleSearch = () => {
    setParams({ ...params, page: 1, search: searchInput || undefined });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-dt-text">
          <Briefcase className="h-6 w-6 text-emerald-500" />
          Job Management
        </h1>
        <p className="mt-1 text-sm text-dt-text-muted">
          {data ? `${data.total} jobs on the platform` : 'Monitor all platform jobs'}
        </p>
      </div>

      {/* Filters */}
      <Card className="border-dt-border bg-dt-surface">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-xs font-medium text-dt-text-muted">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dt-text-muted" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by title..."
                  className="border-dt-border pl-9"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-dt-text-muted">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setParams({ ...params, page: 1 }); }}
                className="rounded-lg border border-dt-border bg-dt-surface px-3 py-2 text-sm text-dt-text"
              >
                <option value="">All Status</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="DISPUTED">Disputed</option>
              </select>
            </div>
            <Button onClick={handleSearch} className="bg-emerald-600 text-white hover:bg-emerald-700">
              <Search className="mr-1 h-4 w-4" /> Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center"><Spinner size="lg" /></div>
      ) : jobs.length === 0 ? (
        <Card className="border-dt-border bg-dt-surface">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Briefcase className="mb-4 h-12 w-12 text-dt-text-muted opacity-40" />
            <h3 className="text-lg font-medium text-dt-text">No jobs found</h3>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dt-border bg-dt-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dt-border bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-4 py-3 text-left font-medium text-dt-text-muted">Job</th>
                  <th className="px-4 py-3 text-left font-medium text-dt-text-muted">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-dt-text-muted">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-dt-text-muted">Budget</th>
                  <th className="px-4 py-3 text-left font-medium text-dt-text-muted">Client</th>
                  <th className="px-4 py-3 text-left font-medium text-dt-text-muted">Activity</th>
                  <th className="px-4 py-3 text-left font-medium text-dt-text-muted">Date</th>
                  <th className="px-4 py-3 text-right font-medium text-dt-text-muted">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dt-border">
                {jobs.map((job: AdminJob) => (
                  <tr key={job.id} className="transition hover:bg-dt-surface-alt">
                    <td className="px-4 py-3">
                      <p className="max-w-[250px] truncate font-medium text-dt-text">{job.title}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn('text-xs', statusBadge[job.status] ?? 'bg-gray-100 text-gray-600')}>
                        {job.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-dt-text-muted capitalize">{job.type?.toLowerCase() ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-dt-text">
                        <DollarSign className="h-3.5 w-3.5 text-dt-text-muted" />
                        {job.budget != null ? (
                          <span>{Number(job.budget).toLocaleString()}</span>
                        ) : (
                          <span className="text-dt-text-muted">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-dt-text-muted">{job.client?.name ?? 'Unknown'}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-dt-text-muted">
                        <p className="flex items-center gap-1"><FileText className="h-3 w-3" />{job._count.proposals} proposals</p>
                        <p className="flex items-center gap-1"><Users className="h-3 w-3" />{job.contract ? '1 contract' : 'No contract'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-dt-text-muted">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/jobs/${job.id}`}>
                        <Button variant="outline" size="sm" className="text-xs">
                          <ExternalLink className="mr-1 h-3 w-3" /> View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-dt-border px-4 py-3">
              <p className="text-xs text-dt-text-muted">
                Page {data.page} of {data.totalPages} · {data.total} jobs
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={!data.hasPrev}
                  onClick={() => setParams({ ...params, page: (params.page ?? 1) - 1 })}>
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Button>
                <Button variant="outline" size="sm" disabled={!data.hasNext}
                  onClick={() => setParams({ ...params, page: (params.page ?? 1) + 1 })}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
