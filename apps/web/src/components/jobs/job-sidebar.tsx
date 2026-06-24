'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Briefcase, CheckCircle2, Shield, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Job } from '@/lib/api/job';
import { useClientProfile } from '@/hooks/queries/use-client-profile';

function formatBudget(job: Job) {
  if (job.type === 'FIXED_PRICE') return job.budget ? `$${Number(job.budget).toLocaleString()}` : 'Budget TBD';
  if (job.hourlyRateMin && job.hourlyRateMax) return `$${Number(job.hourlyRateMin)} - $${Number(job.hourlyRateMax)}/hr`;
  return 'Rate TBD';
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export interface JobSidebarProps {
  job: Job;
  clientAvatarUrl: string | null;
  isOwner: boolean;
}

export function JobSidebar({ job, clientAvatarUrl, isOwner }: JobSidebarProps) {
  const clientId = job.client?.id || '';
  const { data: clientProfile } = useClientProfile(clientId);
  const recentContracts = clientProfile?.recentContracts?.slice(0, 3) ?? [];

  return (
    <div className="space-y-6">
      {/* Client Info */}
      <Card className="border-dt-border bg-dt-surface shadow-lg">
        <CardHeader>
          <CardTitle className="text-base text-dt-text">About the Client</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-emerald-100 bg-dt-surface-alt">
              {clientAvatarUrl ? (
                <Image
                  src={clientAvatarUrl} alt={job.client?.name || 'Client'}
                  width={48} height={48} className="h-full w-full object-cover" unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-emerald-500">
                  {job.client?.name?.[0]?.toUpperCase() || 'C'}
                </div>
              )}
            </div>
            <div>
              <Link href={`/clients/${job.client?.id}`} className="font-medium text-dt-text hover:text-emerald-600 transition-colors">
                {job.client?.name || 'Anonymous Client'}
              </Link>
              {job.client?.clientProfile?.companyName && (
                <p className="text-sm text-dt-text-muted">{job.client.clientProfile.companyName}</p>
              )}
            </div>
          </div>
          <div className="space-y-2 rounded-xl border border-slate-100 bg-dt-surface-alt p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-dt-text-muted">
                <Shield className="h-4 w-4 text-emerald-500" /> Trust Score
              </span>
              <span className="font-medium text-dt-text">{job.client?.clientProfile?.trustScore || 0}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-dt-text-muted">Jobs Posted</span>
              <span className="font-medium text-dt-text">{job.client?.clientProfile?.jobsPosted || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-dt-text-muted">Hire Rate</span>
              <span className="font-medium text-dt-text">{job.client?.clientProfile?.hireRate || 0}%</span>
            </div>
            {typeof job.client?.clientProfile?.avgRating !== 'undefined' && job.client?.clientProfile?.avgRating !== null && Number(job.client.clientProfile.avgRating) > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-dt-text-muted">Avg Rating</span>
                <span className="flex items-center gap-1 font-medium text-dt-text">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {Number(job.client.clientProfile.avgRating).toFixed(1)}
                  {typeof job.client.clientProfile.totalReviews === 'number' && (
                    <span className="text-xs text-dt-text-muted">({job.client.clientProfile.totalReviews})</span>
                  )}
                </span>
              </div>
            )}
            {job.client?.clientProfile?.paymentVerified && (
              <div className="flex items-center gap-1 text-sm text-emerald-600">
                <CheckCircle2 className="h-4 w-4" /> Payment Verified
              </div>
            )}
          </div>
          {job.client?.id && (
            <Link href={`/clients/${job.client.id}`} className="block text-center text-sm text-emerald-600 hover:text-emerald-700 transition-colors">
              View full profile &rarr;
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Recent Work History */}
      {recentContracts.length > 0 && (
        <Card className="border-dt-border bg-dt-surface shadow-lg">
          <CardHeader>
            <CardTitle className="text-base text-dt-text">Recent Work History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentContracts.map((contract) => (
              <div key={contract.id} className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-dt-surface-alt p-3">
                <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-dt-text">{contract.title}</p>
                  <p className="text-xs text-dt-text-muted">
                    {contract.freelancer?.name || 'Freelancer'} &middot; ${Number(contract.totalAmount).toLocaleString()}
                  </p>
                  {contract.completedAt && (
                    <p className="text-xs text-dt-text-muted">
                      Completed {new Date(contract.completedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Job Summary */}
      <Card className="border-dt-border bg-dt-surface shadow-lg">
        <CardHeader>
          <CardTitle className="text-base text-dt-text">Job Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-dt-text-muted">Category</span>
            <span className="font-medium text-dt-text">{job.category}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-dt-text-muted">Job Type</span>
            <span className="font-medium text-dt-text">{job.type === 'FIXED_PRICE' ? 'Fixed Price' : 'Hourly'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-dt-text-muted">Budget</span>
            <span className="font-medium text-dt-text">{formatBudget(job)}</span>
          </div>
          {job.experienceLevel && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-dt-text-muted">Experience</span>
              <span className="font-medium capitalize text-dt-text">{job.experienceLevel.toLowerCase()}</span>
            </div>
          )}
          {job.deadline && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-dt-text-muted">Deadline</span>
              <span className="font-medium text-dt-text">{formatDate(job.deadline)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Owner Actions */}
      {isOwner && (
        <Card className="border-dt-border bg-dt-surface shadow-lg">
          <CardHeader>
            <CardTitle className="text-base text-dt-text">Manage Job</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full bg-emerald-500 text-white hover:bg-emerald-600">
              <Link href={`/jobs/${job.id}/proposals`}>
                View Proposals ({job._count?.proposals || job.proposalCount || 0})
              </Link>
            </Button>
            {job.status === 'DRAFT' && (
              <Button asChild variant="outline" className="w-full border-dt-border">
                <Link href={`/jobs/${job.id}/edit`}>Edit Job</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
