'use client';

import Link from 'next/link';
import { Briefcase, Clock, DollarSign, Shield, Sparkles, Star, ThumbsDown, ThumbsUp } from 'lucide-react';
import { SecureAvatar } from '@/components/secure-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Proposal } from '@/lib/api/proposal';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  SHORTLISTED: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  WITHDRAWN: 'bg-dt-surface-alt text-dt-text-muted',
};

function formatDate(date: string) {
  const d = new Date(date);
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (diffDays < 1) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString();
}

export interface ProposalCardProps {
  proposal: Proposal;
  jobType?: string;
  actionLoading: string | null;
  isAccepting: boolean;
  onStartAccept: (proposalId: string) => void;
  onShortlist: (proposalId: string) => void;
  onReject: (proposalId: string) => void;
  children?: React.ReactNode;
}

export function ProposalCard({ proposal, jobType, actionLoading, isAccepting, onStartAccept, onShortlist, onReject, children }: ProposalCardProps) {
  const fl = proposal.freelancer;
  const profile = fl?.freelancerProfile;
  const busy = !!actionLoading;
  const canAccept = proposal.status === 'PENDING' || proposal.status === 'SHORTLISTED';
  const canShortlist = proposal.status === 'PENDING';

  return (
    <Card className="border-dt-border bg-dt-surface shadow-md">
      <CardContent className="p-6">
        <div className="flex flex-wrap items-start gap-6">
          {/* Freelancer Info */}
          <div className="flex items-start gap-4">
            <SecureAvatar src={fl?.avatarUrl} alt={fl?.name || 'Freelancer'} size={56} fallbackInitial={fl?.name?.[0] || 'F'} containerClassName="h-14 w-14 overflow-hidden rounded-full border-2 border-emerald-100 bg-dt-surface-alt" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-dt-text">{fl?.name || 'Anonymous Freelancer'}</h3>
                <Badge className={STATUS_COLORS[proposal.status]}>{proposal.status}</Badge>
              </div>
              <p className="text-sm text-dt-text-muted">{profile?.title || 'Freelancer'}</p>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-dt-text-muted">
                <span className="flex items-center gap-1"><Shield className="h-4 w-4 text-emerald-500" />{profile?.trustScore || 0}% trust</span>
                <span className="flex items-center gap-1"><Star className="h-4 w-4 text-amber-500" />{Number(profile?.avgRating || 0).toFixed(1)}</span>
                <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" />{profile?.completedJobs || 0} jobs</span>
              </div>
            </div>
          </div>

          {/* Proposal Details */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1 font-semibold text-dt-text">
                <DollarSign className="h-4 w-4 text-emerald-500" />${proposal.proposedRate}{jobType === 'HOURLY' ? '/hr' : ''}
              </span>
              {proposal.estimatedDuration && (
                <span className="flex items-center gap-1 text-dt-text-muted"><Clock className="h-4 w-4" />{proposal.estimatedDuration}</span>
              )}
              <span className="text-slate-400">Submitted {formatDate(proposal.createdAt)}</span>
            </div>
            <p className="text-sm text-dt-text-muted line-clamp-3">{proposal.coverLetter}</p>
            {profile?.skills && (
              <div className="flex flex-wrap gap-1">
                {profile.skills.slice(0, 5).map((s, i) => (
                  <Badge key={i} variant="secondary" className="bg-dt-surface-alt text-xs text-dt-text-muted">{s.skill?.name}</Badge>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {canAccept && (
              <Button size="sm" onClick={() => onStartAccept(proposal.id)} disabled={busy} className="gap-1 bg-emerald-500 text-white hover:bg-emerald-600">
                <ThumbsUp className="h-3 w-3" />Accept
              </Button>
            )}
            {canShortlist && (
              <Button size="sm" variant="outline" onClick={() => onShortlist(proposal.id)} disabled={busy} className="gap-1 border-blue-200 text-blue-600 hover:bg-blue-50">
                <Sparkles className="h-3 w-3" />Shortlist
              </Button>
            )}
            {canAccept && (
              <Button size="sm" variant="outline" onClick={() => onReject(proposal.id)} disabled={busy} className="gap-1 border-red-200 text-red-600 hover:bg-red-50">
                <ThumbsDown className="h-3 w-3" />Reject
              </Button>
            )}
            {proposal.status === 'ACCEPTED' && (
              <Button size="sm" asChild className="gap-1 bg-emerald-500 text-white hover:bg-emerald-600">
                <Link href="/contracts">View Contract</Link>
              </Button>
            )}
          </div>
        </div>

        {isAccepting && children}
      </CardContent>
    </Card>
  );
}
