'use client';

import Link from 'next/link';
import { useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAccount, useBalance } from 'wagmi';
import {
  ArrowUpRight,
  BellRing,
  Briefcase,
  Inbox,
  ListChecks,
  ShieldCheck,
  Sparkles,
  Star,
  Wallet2,
  CheckCircle2,
} from 'lucide-react';

import { useAuthStore } from '@/store/auth.store';
import { ProfileProgressRing } from '@/components/profile/profile-progress-ring';
import { TrustScoreCard } from '@/components/trust-score/trust-score-card';
import { ReviewSummaryCard } from '@/components/reviews/review-summary';
import { useNotifications } from '@/hooks/queries/use-notifications';
import { cn, formatRelativeTime } from '@/lib/utils';

/** Dynamically import recharts-heavy chart (Vercel bundle-dynamic-imports rule) */
const TrustScoreTrendChart = dynamic(
  () => import('@/components/trust-score/trust-score-trend-chart').then((m) => m.TrustScoreTrendChart),
  { ssr: false },
);
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { computeProfileCompletion, shortWallet } from '@/lib/profile-utils';
import { useTrustScore, useTrustScoreHistory } from '@/hooks/queries/use-trust-score';
import { useReviewSummary } from '@/hooks/queries/use-reviews';

const ratingLabel = (value?: number | string | null) => {
  const num = value != null ? Number(value) : NaN;
  return !isNaN(num) && num > 0 ? `${num.toFixed(1)} ★ avg` : 'No reviews yet';
};

const toneClasses: Record<'success' | 'warning' | 'info', string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
  warning: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
  info: 'border-cyan-200 bg-cyan-50 text-cyan-900 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200',
};

export default function DashboardPage() {
  const { user, isNewUser } = useAuthStore();
  const router = useRouter();
  const { address, isConnected } = useAccount();

  // Admins should never land on /dashboard — redirect to /admin
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      router.replace('/admin');
    }
  }, [user?.role, router]);
  const { data: balanceData } = useBalance({
    address,
    query: {
      enabled: Boolean(address && isConnected),
      refetchInterval: 15000,
    },
  });

  const isFreelancer = user?.role === 'FREELANCER';
  const completion = computeProfileCompletion(user);
  const { data: trustScoreBreakdown } = useTrustScore(user?.id ?? '');
  const { data: trustScoreHistory } = useTrustScoreHistory(user?.id ?? '', 30);
  const { data: reviewSummary } = useReviewSummary(user?.id ?? '');
  const freelancerProfile = user?.freelancerProfile;
  const clientProfile = user?.clientProfile;
  const heroStats = useMemo(() => isFreelancer
    ? [
        {
          label: 'Trust score',
          value: `${freelancerProfile?.trustScore ?? 0}%`,
          helper: `${freelancerProfile?.totalReviews ?? 0} reviews`,
        },
        {
          label: 'AI capability',
          value: `${freelancerProfile?.aiCapabilityScore ?? 0}%`,
          helper: 'Signals from skills + verification',
        },
        {
          label: 'Completed jobs',
          value: `${freelancerProfile?.completedJobs ?? 0}`,
          helper: ratingLabel(freelancerProfile?.avgRating),
        },
      ]
    : [
        {
          label: 'Trust score',
          value: `${clientProfile?.trustScore ?? 0}%`,
          helper: `${clientProfile?.totalReviews ?? 0} client reviews`,
        },
        {
          label: 'Hire rate',
          value: `${clientProfile?.hireRate ?? 0}%`,
          helper: `${clientProfile?.jobsPosted ?? 0} jobs posted`,
        },
        {
          label: 'Payment status',
          value: clientProfile?.paymentVerified ? 'Verified' : 'Pending',
          helper: clientProfile?.paymentVerified ? 'Escrow ready' : 'Connect a wallet to auto-verify',
        },
      ], [isFreelancer, freelancerProfile, clientProfile]);

  const notifications = useMemo(() => {
    const entries: Array<{
      title: string;
      detail: string;
      tone: 'success' | 'warning' | 'info';
      action?: { label: string; href: string };
    }> = [];

    const walletLinked = Boolean(user?.walletAddress);

    if (isNewUser || completion < 70) {
      entries.push({
        title: 'Finish your profile',
        detail: 'Hit at least 70% completeness to unlock proposals and escrow.',
        tone: 'warning',
        action: { label: 'Open profile', href: '/profile' },
      });
    }

    if (!walletLinked) {
      entries.push({
        title: 'Connect payout wallet',
        detail: 'Link an Ethereum wallet so we can route escrow releases instantly.',
        tone: 'info',
        action: { label: 'Manage wallet', href: '/profile' },
      });
    }

    if (isFreelancer && (freelancerProfile?.skills?.length ?? 0) < 3) {
      entries.push({
        title: 'Add at least 3 skills',
        detail: 'Verified skills fuel your AI capability score.',
        tone: 'info',
        action: { label: 'Edit skills', href: '/profile' },
      });
    }

    if (!isFreelancer && !clientProfile?.paymentVerified) {
      entries.push({
        title: 'Verify payment method',
        detail: 'Connect a wallet from the navigation bar to auto-verify your payment status.',
        tone: 'warning',
        action: { label: 'Edit profile', href: '/profile' },
      });
    }

    if (entries.length === 0) {
      entries.push({
        title: 'All systems optimal',
        detail: 'You have no pending action items right now. Keep shipping!',
        tone: 'success',
      });
    }

    return entries;
  }, [clientProfile, completion, freelancerProfile, isFreelancer, isNewUser, user?.walletAddress]);

  const workMetrics = useMemo(() => isFreelancer
    ? [
        {
          label: 'Active contracts',
          value: '0',
          helper: 'Contracts appear here once smart escrow kicks off.',
          action: { label: 'Browse jobs', href: '/jobs' },
        },
        {
          label: 'Completed jobs',
          value: `${freelancerProfile?.completedJobs ?? 0}`,
          helper: ratingLabel(freelancerProfile?.avgRating),
        },
      ]
    : [
        {
          label: 'Active jobs',
          value: '0',
          helper: 'New posts go live here once published.',
          action: { label: 'Post a job', href: '/jobs/new' },
        },
        {
          label: 'Jobs posted',
          value: `${clientProfile?.jobsPosted ?? 0}`,
          helper: `${clientProfile?.totalReviews ?? 0} feedback cycles`,
        },
      ], [isFreelancer, freelancerProfile, clientProfile]);

  const proposalsCopy = useMemo(() => isFreelancer
    ? {
        title: 'Proposal pipeline',
        explainer: 'Your submitted proposals will surface here once sent.',
        action: { label: 'View proposals', href: '/proposals' },
      }
    : {
        title: 'Incoming proposals',
        explainer: 'When freelancers respond, you can triage them here.',
        action: { label: 'Review proposals', href: '/jobs/mine' },
      }, [isFreelancer]);

  const tokenBalance = useMemo(() => balanceData
    ? `${Number(balanceData.formatted).toFixed(4)} ${balanceData.symbol}`
    : isConnected
    ? '0.0000'
    : '—', [balanceData, isConnected]);

  if (!user) {
    return (
      <div className="rounded-3xl border border-dt-border bg-dt-surface p-8 text-dt-text-muted shadow-xl">
        We&apos;re syncing your workspace…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[32px] border border-dt-border bg-dt-surface p-8 shadow-[0_35px_80px_-40px_rgba(15,23,42,0.7)]">
        <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_60%),radial-gradient(circle_at_20%_20%,_rgba(59,130,246,0.14),_transparent_45%)]" />
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.6fr,auto]">
          <div>
            <h1 className="mt-4 text-3xl font-semibold text-dt-text">
              {isFreelancer ? 'Ship trustworthy freelance work.' : 'Run verifiable hiring on autopilot.'}
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-dt-text-muted">
              {isFreelancer
                ? 'Smart escrow, AI capability scans, and transparent trust scores help you land contracts without cold starts.'
                : 'Publish roles with embedded escrow, verify payments, and evaluate proposals with transparent trust data.'}
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {heroStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-dt-border bg-dt-surface/90 p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.4em] text-dt-text-muted">{stat.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-dt-text">{stat.value}</p>
                  <p className="text-sm text-dt-text-muted">{stat.helper}</p>
                </div>
              ))}
            </div>
          </div>
          <Card className="border border-dt-border bg-dt-surface/90 text-dt-text shadow-xl">
            <CardHeader>
              <CardTitle className="text-base text-dt-text">Profile progress</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <ProfileProgressRing value={completion} caption="Reach 70%+ to unlock escrow workflows" />
              <Link
                href="/profile"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dt-border bg-dt-surface px-6 py-3 text-sm font-semibold text-dt-text transition hover:bg-dt-surface-alt"
              >
                <ListChecks className="h-4 w-4 text-emerald-500" /> Edit profile
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border border-dt-border bg-dt-surface/90 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-dt-text">
              <Briefcase className="h-4 w-4 text-emerald-500" /> Active workboard
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {workMetrics.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-dt-border bg-dt-surface p-5 shadow-sm">
                <div className="text-xs uppercase tracking-[0.3em] text-dt-text-muted">{metric.label}</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-semibold text-dt-text">{metric.value}</span>
                  {metric.action ? (
                    <Link href={metric.action.href} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                      {metric.action.label} →
                    </Link>
                  ) : null}
                </div>
                <p className="text-sm text-dt-text-muted">{metric.helper}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <DashboardNotificationCard statusHints={notifications} />
      </div>

      {/* Trust Score Breakdown (Module 4) */}
      {trustScoreBreakdown && trustScoreBreakdown.components.length > 0 && (
        <TrustScoreCard breakdown={trustScoreBreakdown} />
      )}

      {/* Trust Score Trend (Module 4 - M4-I4) */}
      {trustScoreHistory && trustScoreHistory.items.length >= 2 && (
        <TrustScoreTrendChart history={trustScoreHistory.items} />
      )}

      {/* Reputation Snapshot (Module 3) */}
      {reviewSummary && reviewSummary.totalReviews > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold text-dt-text">
              <Star className="h-4 w-4 text-amber-400" /> Reputation snapshot
            </h2>
            <Link
              href="/reviews"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              View all reviews <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <ReviewSummaryCard
            summary={reviewSummary}
            subjectRole={isFreelancer ? 'FREELANCER' : 'CLIENT'}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border border-dt-border bg-dt-surface/90 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-dt-text">
              <Inbox className="h-4 w-4 text-cyan-500" /> {proposalsCopy.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-dt-text-muted">{proposalsCopy.explainer}</p>
            <div className="rounded-2xl border border-dashed border-dt-border bg-dt-surface-alt p-4 text-center text-xs uppercase tracking-[0.3em] text-dt-text-muted">
              Pipeline idle
            </div>
            <Link
              href={proposalsCopy.action.href}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dt-border bg-dt-surface px-6 py-3 text-sm font-semibold text-dt-text transition hover:bg-dt-surface-alt"
            >
              {proposalsCopy.action.label}
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            </Link>
          </CardContent>
        </Card>

        <Card className="border border-dt-border bg-dt-surface/90 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-dt-text">
              <Wallet2 className="h-4 w-4 text-emerald-500" /> Wallet & token balance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-dt-text-muted">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-dt-text-muted">Balance</p>
              <p className="mt-2 text-3xl font-semibold text-dt-text">{tokenBalance}</p>
              <p className="text-sm text-dt-text-muted">
                {isConnected ? 'Live balance from connected wallet' : 'Connect a wallet to preview on-chain funds.'}
              </p>
            </div>
            <div className="rounded-2xl border border-dt-border bg-dt-surface p-4 text-sm shadow-sm">
              <div className="text-xs uppercase tracking-[0.3em] text-dt-text-muted">Wallet</div>
              <div className="font-mono text-base text-dt-text">{shortWallet((isConnected && address) ? address : user.walletAddress)}</div>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
              <div className="text-xs uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">Status</div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                {(isConnected && address) || user.walletAddress ? 'Escrow payouts ready' : 'Awaiting wallet pairing'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-dt-border bg-dt-surface/90 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-dt-text">
              <Sparkles className="h-4 w-4 text-fuchsia-500" /> Rituals checklist
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-dt-text-muted">
            <Link
              href="/reviews"
              className="block rounded-2xl border border-dt-border bg-dt-surface p-4 shadow-sm transition hover:border-emerald-300 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:hover:border-emerald-700"
            >
              <p className="font-medium text-dt-text">Check your reviews & reputation</p>
              <p className="text-xs text-dt-text-muted">View ratings and feedback from completed contracts.</p>
            </Link>
            <div className="rounded-2xl border border-dt-border bg-dt-surface p-4 shadow-sm">
              <p className="font-medium text-dt-text">Review trust signals weekly</p>
              <p className="text-xs text-dt-text-muted">Boost your score by reflecting new deliverables.</p>
            </div>
            <div className="rounded-2xl border border-dt-border bg-dt-surface p-4 shadow-sm">
              <p className="font-medium text-dt-text">{isFreelancer ? 'Take a capability microtask' : 'Share milestone proofs'}</p>
              <p className="text-xs text-dt-text-muted">
                {isFreelancer
                  ? 'Re-run AI capability scans when you add evidence.'
                  : 'Keep talent updated with escrow-backed status updates.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Dashboard Notification Card ─────────────────────────────────────────────
function DashboardNotificationCard({ statusHints }: {
  statusHints: Array<{
    title: string;
    detail: string;
    tone: 'success' | 'warning' | 'info';
    action?: { label: string; href: string };
  }>;
}) {
  const { data: notificationsData } = useNotifications({ limit: 5 });
  const realNotifications = notificationsData?.items ?? [];
  const hasRealNotifications = realNotifications.length > 0;

  return (
    <Card className="border border-dt-border bg-dt-surface/90 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-dt-text">
          <BellRing className="h-4 w-4 text-amber-400" /> Notification center
          {hasRealNotifications && (
            <span className="ml-auto text-xs font-normal text-dt-text-muted">
              {realNotifications.length} recent
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasRealNotifications ? (
          <>
            {realNotifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  'rounded-2xl border px-4 py-3 text-sm transition-colors',
                  n.read
                    ? 'border-dt-border bg-dt-surface'
                    : 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className={cn('truncate text-sm', n.read ? 'text-dt-text-muted' : 'font-semibold text-dt-text')}>
                      {n.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-dt-text-muted">{n.message}</p>
                  </div>
                  <span className="flex-shrink-0 text-[11px] text-dt-text-muted">
                    {formatRelativeTime(n.createdAt)}
                  </span>
                </div>
              </div>
            ))}
            <Link
              href="/notifications"
              className="inline-flex w-full items-center justify-center gap-1 rounded-xl border border-dt-border bg-dt-surface px-4 py-2.5 text-xs font-semibold text-dt-text-muted transition hover:bg-dt-surface-alt"
            >
              View all notifications <ArrowUpRight className="h-3 w-3" />
            </Link>
          </>
        ) : (
          statusHints.map((notification) => (
            <div
              key={notification.title}
              className={`rounded-2xl border px-4 py-3 text-sm ${toneClasses[notification.tone]}`}
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold">{notification.title}</p>
                {notification.tone === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : null}
              </div>
              <p className="text-xs text-dt-text-muted">{notification.detail}</p>
              {notification.action ? (
                <Link
                  href={notification.action.href}
                  className="mt-2 inline-flex items-center text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-dt-text-muted"
                >
                  {notification.action.label}
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </Link>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
