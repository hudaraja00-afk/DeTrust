'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Briefcase,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Filter,
  Search,
  Shield,
  SortAsc,
  Sparkles,
  Users,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import type { Job, GetJobsParams } from '@/lib/api/job';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import { useJobs } from '@/hooks/queries/use-jobs';
import { useSkills } from '@/hooks/queries/use-skills';

const EXPERIENCE_LEVELS = [
  { value: '', label: 'All Levels' },
  { value: 'ENTRY', label: 'Entry Level' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'EXPERT', label: 'Expert' },
];

const JOB_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'FIXED_PRICE', label: 'Fixed Price' },
  { value: 'HOURLY', label: 'Hourly' },
];

const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Newest First' },
  { value: 'budget:desc', label: 'Budget: High to Low' },
  { value: 'budget:asc', label: 'Budget: Low to High' },
  { value: 'proposalCount:desc', label: 'Most Proposals' },
];

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
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
};

function JobBoardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();

  const [filters, setFilters] = useState<GetJobsParams>({
    page: Number(searchParams.get('page')) || 1,
    limit: 10,
    search: searchParams.get('search') || '',
    type: (searchParams.get('type') as GetJobsParams['type']) || undefined,
    experienceLevel: (searchParams.get('experienceLevel') as GetJobsParams['experienceLevel']) || undefined,
    skills: searchParams.get('skills') || undefined,
    minBudget: Number(searchParams.get('minBudget')) || undefined,
    maxBudget: Number(searchParams.get('maxBudget')) || undefined,
    sort: (searchParams.get('sort') as GetJobsParams['sort']) || 'createdAt',
    order: (searchParams.get('order') as GetJobsParams['order']) || 'desc',
  });

  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useJobs({ ...filters, status: 'OPEN' });
  const { data: skillsData } = useSkills({ limit: 100 });

  const jobs = data?.items ?? [];
  const skills = skillsData?.items ?? [];
  const pagination = {
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    totalPages: data?.totalPages ?? 1,
    hasNext: data?.hasNext ?? false,
    hasPrev: data?.hasPrev ?? false,
  };

  const updateFilters = (newFilters: Partial<GetJobsParams>) => {
    const updated = { ...filters, ...newFilters, page: 1 };
    setFilters(updated);

    const params = new URLSearchParams();
    Object.entries(updated).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && key !== 'limit') {
        params.set(key, String(value));
      }
    });
    router.push(`/jobs?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dt-text">Find Work</h1>
          <p className="text-dt-text-muted">
            Discover opportunities that match your skills and experience
          </p>
        </div>
        {user?.role === 'CLIENT' && (
          <Button asChild className="bg-emerald-500 text-white hover:bg-emerald-600">
            <Link href="/jobs/new">Post a Job</Link>
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card className="border-dt-border bg-dt-surface shadow-lg">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dt-text-muted" />
              <Input
                type="search"
                placeholder="Search jobs by title or keyword..."
                value={filters.search || ''}
                onChange={(e) => updateFilters({ search: e.target.value })}
                className="pl-10 border-dt-border"
              />
            </div>

            {/* Toggle Filters */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2 border-dt-border"
            >
              <Filter className="h-4 w-4" />
              Filters
              {(filters.type || filters.experienceLevel || filters.skills || filters.minBudget || filters.maxBudget) && (
                <Badge className="ml-1 bg-emerald-100 text-emerald-700">Active</Badge>
              )}
            </Button>

            {/* Sort */}
            <select
              value={`${filters.sort}:${filters.order}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split(':') as [GetJobsParams['sort'], GetJobsParams['order']];
                updateFilters({ sort, order });
              }}
              className="rounded-lg border border-dt-border px-3 py-2 text-sm"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 md:grid-cols-3">
              {/* Job Type */}
              <div>
                <label className="mb-2 block text-sm font-medium text-dt-text-muted">
                  Job Type
                </label>
                <select
                  value={filters.type || ''}
                  onChange={(e) =>
                    updateFilters({
                      type: e.target.value as GetJobsParams['type'] || undefined,
                    })
                  }
                  className="w-full rounded-lg border border-dt-border px-3 py-2 text-sm"
                >
                  {JOB_TYPES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Experience Level */}
              <div>
                <label className="mb-2 block text-sm font-medium text-dt-text-muted">
                  Experience Level
                </label>
                <select
                  value={filters.experienceLevel || ''}
                  onChange={(e) =>
                    updateFilters({
                      experienceLevel: e.target.value as GetJobsParams['experienceLevel'] || undefined,
                    })
                  }
                  className="w-full rounded-lg border border-dt-border px-3 py-2 text-sm"
                >
                  {EXPERIENCE_LEVELS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Skills */}
              <div>
                <label className="mb-2 block text-sm font-medium text-dt-text-muted">
                  Skills
                </label>
                <select
                  value={filters.skills || ''}
                  onChange={(e) =>
                    updateFilters({ skills: e.target.value || undefined })
                  }
                  className="w-full rounded-lg border border-dt-border px-3 py-2 text-sm"
                >
                  <option value="">All Skills</option>
                  {skills.map((skill) => (
                    <option key={skill.id} value={skill.id}>
                      {skill.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Budget Range */}
              <div>
                <label className="mb-2 block text-sm font-medium text-dt-text-muted">
                  Min Budget ($)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dt-text-muted" />
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.minBudget || ''}
                    onChange={(e) =>
                      updateFilters({ minBudget: Number(e.target.value) || undefined })
                    }
                    className="border-dt-border pl-9 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-dt-text-muted">
                  Max Budget ($)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dt-text-muted" />
                  <Input
                    type="number"
                    placeholder="No limit"
                    value={filters.maxBudget || ''}
                    onChange={(e) =>
                      updateFilters({ maxBudget: Number(e.target.value) || undefined })
                    }
                    className="border-dt-border pl-9 text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job Listings */}
      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : jobs.length === 0 ? (
        <Card className="border-dt-border bg-dt-surface shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Briefcase className="h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-lg font-semibold text-dt-text">No jobs found</h3>
            <p className="mt-2 text-dt-text-muted">Try adjusting your filters or search terms</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <Card className="border-dt-border bg-dt-surface shadow-md transition-all hover:border-emerald-200 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Title and Type */}
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-dt-text">
                          {job.title}
                        </h3>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            job.type === 'FIXED_PRICE'
                              ? 'border-blue-200 bg-blue-50 text-blue-700'
                              : 'border-purple-200 bg-purple-50 text-purple-700'
                          )}
                        >
                          {job.type === 'FIXED_PRICE' ? 'Fixed Price' : 'Hourly'}
                        </Badge>
                        {job.experienceLevel && (
                          <Badge
                            variant="outline"
                            className="border-dt-border text-xs text-dt-text-muted"
                          >
                            {job.experienceLevel.toLowerCase()}
                          </Badge>
                        )}
                      </div>

                      {/* Description */}
                      <p className="line-clamp-2 text-sm text-dt-text-muted">
                        {job.description}
                      </p>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-2">
                        {job.skills.slice(0, 5).map((js) => (
                          <Badge
                            key={js.id}
                            variant="secondary"
                            className="bg-dt-surface-alt text-dt-text-muted"
                          >
                            {js.skill.name}
                          </Badge>
                        ))}
                        {job.skills.length > 5 && (
                          <Badge variant="secondary" className="bg-dt-surface-alt text-dt-text-muted">
                            +{job.skills.length - 5} more
                          </Badge>
                        )}
                      </div>

                      {/* Meta Info */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-dt-text-muted">
                        {job.client?.clientProfile?.companyName && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {job.client.clientProfile.companyName}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Shield className="h-4 w-4 text-emerald-500" />
                          {job.client?.clientProfile?.trustScore || 0}% trust
                        </span>
                        {job.client?.clientProfile?.paymentVerified && (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <Sparkles className="h-4 w-4" />
                            Payment Verified
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {job._count?.proposals || job.proposalCount || 0} proposals
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDate(job.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Budget */}
                    <div className="text-right">
                      <div className="text-lg font-semibold text-dt-text">
                        {formatBudget(job)}
                      </div>
                      {job.deadline && (
                        <div className="flex items-center justify-end gap-1 text-sm text-dt-text-muted">
                          <Calendar className="h-3 w-3" />
                          Due {new Date(job.deadline).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
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
                  onClick={() => handlePageChange(pagination.page - 1)}
                  className="border-dt-border"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNext}
                  onClick={() => handlePageChange(pagination.page + 1)}
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

export default function JobBoardPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[300px] items-center justify-center"><Spinner size="lg" /></div>}>
      <JobBoardPageContent />
    </Suspense>
  );
}
