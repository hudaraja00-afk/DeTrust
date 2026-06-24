'use client';

import { Suspense, useCallback, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Filter,
  MapPin,
  Search,
  Shield,
  Star,
  Users,
} from 'lucide-react';

import { SecureAvatar } from '@/components/secure-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useFreelancers } from '@/hooks/queries/use-user';
import { useSkills } from '@/hooks/queries/use-skills';

const SORT_OPTIONS = [
  { value: 'trustScore', label: 'Trust Score' },
  { value: 'avgRating', label: 'Rating' },
  { value: 'completedJobs', label: 'Jobs Completed' },
  { value: 'createdAt', label: 'Newest' },
];

function TalentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    page: Number(searchParams.get('page')) || 1,
    limit: 12,
    search: searchParams.get('search') || '',
    skills: searchParams.get('skills') || '',
    minTrustScore: searchParams.get('minTrustScore') ? Number(searchParams.get('minTrustScore')) : undefined,
    minRating: searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined,
    sort: (searchParams.get('sort') as 'trustScore' | 'avgRating' | 'completedJobs' | 'createdAt') || 'trustScore',
    order: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
  });

  const { data, isLoading } = useFreelancers(filters);
  const freelancers = data?.items ?? [];
  const pagination = useMemo(() => ({
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    totalPages: data?.totalPages ?? 1,
    hasNext: data?.hasNext ?? false,
    hasPrev: data?.hasPrev ?? false,
  }), [data]);

  const { data: skillsData } = useSkills({ limit: 100 });
  const skills = skillsData?.items ?? [];

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    const updated = { ...filters, ...newFilters, page: 1 };
    setFilters(updated);

    // Update URL params
    const params = new URLSearchParams();
    Object.entries(updated).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && key !== 'limit') {
        params.set(key, String(value));
      }
    });
    router.push(`/talent?${params.toString()}`);
  }, [filters, router]);

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dt-text">Find Talent</h1>
          <p className="text-dt-text-muted">
            Discover verified freelancers with proven track records
          </p>
        </div>
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
                placeholder="Search by name, title, or skills..."
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
                className="pl-10 border-dt-border"
              />
            </div>

            {/* Sort */}
            <select
              value={filters.sort}
              onChange={(e) => updateFilters({ sort: e.target.value as typeof filters.sort })}
              className="rounded-lg border border-dt-border px-3 py-2 text-sm"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Sort by {opt.label}
                </option>
              ))}
            </select>

            {/* Toggle Filters */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2 border-dt-border"
            >
              <Filter className="h-4 w-4" />
              Filters
              {(filters.skills || filters.minTrustScore || filters.minRating) && (
                <Badge className="ml-1 bg-emerald-100 text-emerald-700">Active</Badge>
              )}
            </Button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 md:grid-cols-3">
              {/* Skills */}
              <div>
                <label className="mb-2 block text-sm font-medium text-dt-text-muted">
                  Skills
                </label>
                <select
                  value={filters.skills}
                  onChange={(e) => updateFilters({ skills: e.target.value })}
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

              {/* Min Trust Score */}
              <div>
                <label className="mb-2 block text-sm font-medium text-dt-text-muted">
                  Min Trust Score
                </label>
                <select
                  value={filters.minTrustScore || ''}
                  onChange={(e) =>
                    updateFilters({
                      minTrustScore: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full rounded-lg border border-dt-border px-3 py-2 text-sm"
                >
                  <option value="">Any</option>
                  <option value="50">50%+</option>
                  <option value="70">70%+</option>
                  <option value="80">80%+</option>
                  <option value="90">90%+</option>
                </select>
              </div>

              {/* Min Rating */}
              <div>
                <label className="mb-2 block text-sm font-medium text-dt-text-muted">
                  Min Rating
                </label>
                <select
                  value={filters.minRating || ''}
                  onChange={(e) =>
                    updateFilters({
                      minRating: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full rounded-lg border border-dt-border px-3 py-2 text-sm"
                >
                  <option value="">Any</option>
                  <option value="3">3+ Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="4.5">4.5+ Stars</option>
                </select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Freelancer Grid */}
      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : freelancers.length === 0 ? (
        <Card className="border-dt-border bg-dt-surface shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-lg font-semibold text-dt-text">No freelancers found</h3>
            <p className="mt-2 text-dt-text-muted">Try adjusting your filters or search terms</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {freelancers.map((freelancer) => (
              <Link key={freelancer.id} href={`/talent/${freelancer.id}`}>
                <Card className="h-full border-dt-border bg-dt-surface shadow-md transition-all hover:border-emerald-200 hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <SecureAvatar
                        src={freelancer.avatarUrl}
                        alt={freelancer.name || 'Freelancer'}
                        size={64}
                        fallbackInitial={freelancer.name?.[0] || 'F'}
                        containerClassName="h-16 w-16 overflow-hidden rounded-full border-2 border-emerald-100 bg-dt-surface-alt"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-dt-text">
                          {freelancer.name || 'Anonymous'}
                        </h3>
                        <p className="text-sm text-dt-text-muted">
                          {freelancer.freelancerProfile?.title || 'Freelancer'}
                        </p>
                        {freelancer.freelancerProfile?.location && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-dt-text-muted">
                            <MapPin className="h-3 w-3" />
                            {freelancer.freelancerProfile.location}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-slate-100 bg-dt-surface-alt p-3">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-sm font-semibold text-dt-text">
                          <Shield className="h-4 w-4 text-emerald-500" />
                          {freelancer.freelancerProfile?.trustScore || 0}%
                        </div>
                        <p className="text-xs text-dt-text-muted">Trust</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-sm font-semibold text-dt-text">
                          <Star className="h-4 w-4 text-amber-500" />
                          {Number(freelancer.freelancerProfile?.avgRating || 0).toFixed(1)}
                        </div>
                        <p className="text-xs text-dt-text-muted">Rating</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-sm font-semibold text-dt-text">
                          <Briefcase className="h-4 w-4 text-blue-500" />
                          {freelancer.freelancerProfile?.completedJobs || 0}
                        </div>
                        <p className="text-xs text-dt-text-muted">Jobs</p>
                      </div>
                    </div>

                    {/* Skills */}
                    {freelancer.freelancerProfile?.skills && freelancer.freelancerProfile.skills.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1">
                        {freelancer.freelancerProfile.skills.slice(0, 3).map((s, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="bg-dt-surface-alt text-xs text-dt-text-muted"
                          >
                            {s.skill?.name}
                          </Badge>
                        ))}
                        {freelancer.freelancerProfile.skills.length > 3 && (
                          <Badge variant="secondary" className="bg-dt-surface-alt text-xs text-dt-text-muted">
                            +{freelancer.freelancerProfile.skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Rate */}
                    {freelancer.freelancerProfile?.hourlyRate && (
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm text-dt-text-muted">Hourly Rate</span>
                        <span className="font-semibold text-dt-text">
                          ${freelancer.freelancerProfile.hourlyRate}/hr
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-dt-text-muted">
                Showing {(pagination.page - 1) * 12 + 1} to{' '}
                {Math.min(pagination.page * 12, pagination.total)} of {pagination.total} freelancers
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
        </>
      )}
    </div>
  );
}

export default function TalentPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[300px] items-center justify-center"><Spinner size="lg" /></div>}>
      <TalentPageContent />
    </Suspense>
  );
}
