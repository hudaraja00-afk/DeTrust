'use client';

import { useState } from 'react';
import { BarChart3, Shield, Star, Briefcase, DollarSign, Clock, X } from 'lucide-react';
import { SecureAvatar } from '@/components/secure-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Proposal } from '@/lib/api/proposal';

interface ProposalComparisonProps {
  proposals: Proposal[];
  onClose: () => void;
}

function getScoreColor(score: number): string {
  if (score > 75) return 'text-emerald-500';
  if (score >= 50) return 'text-blue-500';
  if (score > 0) return 'text-amber-500';
  return 'text-slate-400';
}

function getBarWidth(value: number, max: number): string {
  return max > 0 ? `${(value / max) * 100}%` : '0%';
}

function getBarColorClass(score: number): string {
  if (score > 75) return 'bg-emerald-400';
  if (score >= 50) return 'bg-blue-400';
  if (score > 0) return 'bg-amber-400';
  return 'bg-slate-300';
}

function ComparisonRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px,1fr] items-center gap-4 border-b border-dt-border py-3 last:border-b-0">
      <span className="text-xs font-medium uppercase tracking-wider text-dt-text-muted">{label}</span>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">{children}</div>
    </div>
  );
}

export function ProposalComparison({ proposals, onClose }: ProposalComparisonProps) {
  const [selected, setSelected] = useState<string[]>(
    proposals.slice(0, 3).map((p) => p.id),
  );

  const compared = proposals.filter((p) => selected.includes(p.id));
  const maxRate = Math.max(...compared.map((p) => p.proposedRate), 1);
  const maxTrust = Math.max(
    ...compared.map((p) => p.freelancer?.freelancerProfile?.trustScore ?? 0),
    1,
  );
  const maxJobs = Math.max(
    ...compared.map((p) => p.freelancer?.freelancerProfile?.completedJobs ?? 0),
    1,
  );

  if (compared.length < 2) return null;

  return (
    <Card className="border-dt-border bg-dt-surface shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base text-dt-text">
            <BarChart3 className="h-5 w-5 text-emerald-500" />
            Compare Proposals ({compared.length})
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        {proposals.length > 3 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {proposals.map((p) => (
              <Badge
                key={p.id}
                variant={selected.includes(p.id) ? 'default' : 'secondary'}
                className={cn(
                  'cursor-pointer transition-colors',
                  selected.includes(p.id)
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'bg-dt-surface-alt text-dt-text-muted hover:bg-dt-surface',
                )}
                onClick={() => {
                  if (selected.includes(p.id)) {
                    if (selected.length > 2) setSelected(selected.filter((id) => id !== p.id));
                  } else if (selected.length < 3) {
                    setSelected([...selected, p.id]);
                  }
                }}
              >
                {p.freelancer?.name || 'Anonymous'}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-0">
        {/* Headers */}
        <div className="grid grid-cols-[140px,1fr] items-center gap-4 border-b border-dt-border pb-3">
          <span />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {compared.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <SecureAvatar
                  src={p.freelancer?.avatarUrl}
                  alt={p.freelancer?.name || 'F'}
                  size={32}
                  fallbackInitial={p.freelancer?.name?.[0] || 'F'}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-dt-text">
                    {p.freelancer?.name || 'Anonymous'}
                  </p>
                  <p className="truncate text-xs text-dt-text-muted">
                    {p.freelancer?.freelancerProfile?.title || 'Freelancer'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rate */}
        <ComparisonRow label="Proposed Rate">
          {compared.map((p) => (
            <div key={p.id} className="flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-emerald-500" />
              <span className="font-semibold text-dt-text">${p.proposedRate}</span>
              <div className="ml-2 h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{ width: getBarWidth(p.proposedRate, maxRate) }}
                />
              </div>
            </div>
          ))}
        </ComparisonRow>

        {/* Trust Score */}
        <ComparisonRow label="Trust Score">
          {compared.map((p) => {
            const score = p.freelancer?.freelancerProfile?.trustScore ?? 0;
            return (
              <div key={p.id} className="flex items-center gap-1">
                <Shield className={cn('h-3 w-3', getScoreColor(score))} />
                <span className={cn('font-semibold', getScoreColor(score))}>{score}%</span>
                <div className="ml-2 h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={cn('h-full rounded-full', getBarColorClass(score))}
                    style={{ width: getBarWidth(score, maxTrust) }}
                  />
                </div>
              </div>
            );
          })}
        </ComparisonRow>

        {/* Rating */}
        <ComparisonRow label="Avg Rating">
          {compared.map((p) => {
            const rating = Number(p.freelancer?.freelancerProfile?.avgRating ?? 0);
            return (
              <div key={p.id} className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-dt-text">{rating > 0 ? rating.toFixed(1) : '—'}</span>
                <span className="text-xs text-dt-text-muted">
                  ({p.freelancer?.freelancerProfile?.totalReviews ?? 0})
                </span>
              </div>
            );
          })}
        </ComparisonRow>

        {/* Completed Jobs */}
        <ComparisonRow label="Completed Jobs">
          {compared.map((p) => {
            const jobs = p.freelancer?.freelancerProfile?.completedJobs ?? 0;
            return (
              <div key={p.id} className="flex items-center gap-1">
                <Briefcase className="h-3 w-3 text-dt-text-muted" />
                <span className="font-semibold text-dt-text">{jobs}</span>
                <div className="ml-2 h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-blue-400"
                    style={{ width: getBarWidth(jobs, maxJobs) }}
                  />
                </div>
              </div>
            );
          })}
        </ComparisonRow>

        {/* Duration */}
        <ComparisonRow label="Est. Duration">
          {compared.map((p) => (
            <div key={p.id} className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-dt-text-muted" />
              <span className="text-sm text-dt-text">{p.estimatedDuration || '—'}</span>
            </div>
          ))}
        </ComparisonRow>

        {/* Skills Match */}
        <ComparisonRow label="Skills">
          {compared.map((p) => (
            <div key={p.id} className="flex flex-wrap gap-1">
              {(p.freelancer?.freelancerProfile?.skills ?? []).slice(0, 4).map((s, i) => (
                <Badge key={i} variant="secondary" className="bg-dt-surface-alt text-[10px] text-dt-text-muted">
                  {s.skill?.name}
                </Badge>
              ))}
              {(p.freelancer?.freelancerProfile?.skills?.length ?? 0) > 4 && (
                <Badge variant="secondary" className="bg-dt-surface-alt text-[10px] text-dt-text-muted">
                  +{(p.freelancer?.freelancerProfile?.skills?.length ?? 0) - 4}
                </Badge>
              )}
            </div>
          ))}
        </ComparisonRow>
      </CardContent>
    </Card>
  );
}
