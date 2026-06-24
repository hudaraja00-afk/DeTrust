'use client';

import { Calendar, Clock, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Job } from '@/lib/api/job';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBudget(job: Job) {
  if (job.type === 'FIXED_PRICE') {
    return job.budget ? `$${Number(job.budget).toLocaleString()}` : 'Budget TBD';
  }
  if (job.hourlyRateMin && job.hourlyRateMax) {
    return `$${Number(job.hourlyRateMin)} - $${Number(job.hourlyRateMax)}/hr`;
  }
  return 'Rate TBD';
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface JobDetailHeaderProps {
  job: Job;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function JobDetailHeader({ job }: JobDetailHeaderProps) {
  return (
    <Card className="border-dt-border bg-dt-surface shadow-lg">
      <CardContent className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            {/* Status / type / experience badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className={cn(
                  'text-xs',
                  job.status === 'OPEN'
                    ? 'bg-emerald-100 text-emerald-700'
                    : job.status === 'IN_PROGRESS'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-dt-surface-alt text-dt-text-muted'
                )}
              >
                {job.status.replace('_', ' ')}
              </Badge>
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
                <Badge variant="outline" className="border-dt-border text-xs text-dt-text-muted">
                  {job.experienceLevel.toLowerCase()}
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-semibold text-dt-text">{job.title}</h1>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-dt-text-muted">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Posted {formatDate(job.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {job._count?.proposals || job.proposalCount || 0} proposals
              </span>
              {job.deadline && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Due {formatDate(job.deadline)}
                </span>
              )}
            </div>
          </div>

          {/* Budget */}
          <div className="text-right">
            <div className="text-2xl font-semibold text-dt-text">{formatBudget(job)}</div>
            {job.estimatedHours && (
              <div className="text-sm text-dt-text-muted">~{job.estimatedHours} hours</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
