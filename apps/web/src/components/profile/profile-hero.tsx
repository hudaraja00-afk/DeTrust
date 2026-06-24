'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, PenLine } from 'lucide-react';
import { type ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { AiCapabilityBadge } from '@/components/trust-score/ai-capability-badge';
import type { User, FreelancerProfile, ClientProfile } from '@/lib/api/user';

export interface HighlightStat {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
}

export interface ProfileHeroProps {
  profile: User;
  completion: number;
  profileComplete: boolean;
  avatarObjectUrl: string | null;
  avatarLoading: boolean;
  highlightStats: HighlightStat[];
  walletBadgeLabel: string;
  role: string;
  isFreelancer: boolean;
  freelancerProfile: FreelancerProfile | null;
  clientProfile: ClientProfile | null;
  languages: string;
}

export function ProfileHero({
  profile,
  completion,
  profileComplete,
  avatarObjectUrl,
  avatarLoading,
  highlightStats,
  walletBadgeLabel,
  role,
  isFreelancer,
  freelancerProfile,
  clientProfile,
  languages,
}: ProfileHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-dt-surface via-dt-surface-alt to-dt-surface-alt p-8 text-dt-text shadow-[0_35px_120px_rgba(15,23,42,0.12)]">
      <div className="absolute inset-0 opacity-80" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(79,70,229,0.12),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(16,185,129,0.12),transparent_45%)]" />
      </div>
      <div className="relative z-10 flex flex-wrap items-start gap-8">
        <div className="flex items-start gap-5">
          <div className="group relative h-24 w-24 overflow-hidden rounded-3xl border border-dt-border bg-dt-surface p-1 shadow-xl">
            {avatarObjectUrl ? (
              <Image src={avatarObjectUrl} alt={profile.name ?? 'Avatar'} fill className="rounded-2xl object-cover" sizes="96px" unoptimized />
            ) : avatarLoading ? (
              <div className="flex h-full w-full items-center justify-center">
                <Spinner size="sm" />
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl">{'\u{1FAAA}'}</div>
            )}
            <div className="absolute inset-0 rounded-3xl border border-emerald-400/40 opacity-0 transition group-hover:opacity-100" />
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.4em] text-dt-text-muted">
              <span>{role.toLowerCase()}</span>
              <span className="h-0.5 w-8 bg-slate-200" />
              <span>{profileComplete ? 'ready' : 'in progress'}</span>
            </div>
            <h1 className="text-3xl font-semibold text-dt-text">{profile.name || 'Unnamed talent'}</h1>
            <p className="text-base text-dt-text-muted">{isFreelancer ? freelancerProfile?.title || 'Add a headline to unlock discovery' : clientProfile?.companyName || 'Add your organization name'}</p>
            <div className="flex flex-wrap gap-3 text-sm text-dt-text-muted">
              <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4 text-dt-text" /> {freelancerProfile?.location || clientProfile?.location || 'Location TBD'}</span>
              {freelancerProfile?.timezone && <span>UTC {freelancerProfile.timezone}</span>}
              {languages && <span>{languages}</span>}
            </div>
            <div className="flex flex-wrap gap-3">
              <Badge variant="success">
                {profileComplete ? 'Profile clears trust threshold' : 'Complete profile to unlock proposals'}
              </Badge>
              <Badge variant="outline" className="border-dt-border text-dt-text-muted">
                {walletBadgeLabel}
              </Badge>
              {isFreelancer && typeof freelancerProfile?.aiCapabilityScore === 'number' ? (
                <AiCapabilityBadge score={freelancerProfile.aiCapabilityScore} size="sm" />
              ) : null}
            </div>
          </div>
        </div>
        <div className="ml-auto flex flex-col items-end gap-4 text-right">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-dt-text-muted">Completion</p>
            <p className="text-5xl font-light text-dt-text">{completion}%</p>
            <p className="text-sm text-dt-text-muted">Reach 70%+ to surface in curated searches.</p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/profile/edit" className="flex items-center gap-2">
              <PenLine className="h-4 w-4" /> Edit profile
            </Link>
          </Button>
        </div>
      </div>
      <div className="relative z-10 mt-8 grid gap-4 md:grid-cols-3">
        {highlightStats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-dt-border bg-dt-surface p-4 shadow-inner">
            <div className="flex items-center gap-3 text-sm text-dt-text-muted">
              {stat.icon}
              <span>{stat.label}</span>
            </div>
            <div className="mt-3 text-2xl font-semibold text-dt-text">{stat.value}</div>
            <p className="text-sm text-dt-text-muted">{stat.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
