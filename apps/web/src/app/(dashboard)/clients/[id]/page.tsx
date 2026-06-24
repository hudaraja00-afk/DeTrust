'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Shield,
  Star,
  Users,
  XCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { SecureAvatar } from '@/components/secure-avatar';
import { useClientProfile } from '@/hooks/queries/use-client-profile';
import { useUserReviews, useReviewSummary } from '@/hooks/queries/use-reviews';
import { useTrustScore } from '@/hooks/queries/use-trust-score';
import { ReviewSummaryCard } from '@/components/reviews/review-summary';
import { ReviewList } from '@/components/reviews/review-list';
import { TrustScoreCard } from '@/components/trust-score/trust-score-card';

export default function ClientProfilePage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  const { data: profile, isLoading } = useClientProfile(clientId);
  const { data: reviewSummary } = useReviewSummary(clientId);
  const { data: reviewsData } = useUserReviews(clientId, { page: 1, limit: 10 });
  const { data: trustScoreBreakdown } = useTrustScore(clientId);

  const cp = profile?.user.clientProfile;

  const highlightStats = useMemo(() => [
    {
      label: 'Trust score',
      value: `${Number(cp?.trustScore ?? 0)}%`,
      detail: `${cp?.totalReviews ?? 0} talent reviews`,
      icon: <Shield className="h-4 w-4 text-emerald-500" />,
    },
    {
      label: 'Hire rate',
      value: `${Number(cp?.hireRate ?? 0)}%`,
      detail: `${cp?.jobsPosted ?? 0} jobs posted`,
      icon: <Briefcase className="h-4 w-4 text-blue-500" />,
    },
    {
      label: 'Rating',
      value: Number(cp?.avgRating ?? 0).toFixed(1),
      detail: `${cp?.totalReviews ?? 0} reviews`,
      icon: <Star className="h-4 w-4 text-amber-500" />,
    },
    {
      label: 'Total invested',
      value: `$${Number(cp?.totalSpent ?? 0).toLocaleString()}`,
      detail: 'Across DeTrust contracts',
      icon: <DollarSign className="h-4 w-4 text-emerald-500" />,
    },
  ], [cp]);

  const getLinkLabel = (value: string) => {
    try {
      const url = new URL(value);
      return url.hostname.replace(/^www\./, '');
    } catch {
      return value;
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <XCircle className="h-12 w-12 text-slate-300" />
        <h3 className="mt-4 text-lg font-semibold text-dt-text">Client not found</h3>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const { user, recentContracts } = profile;

  return (
    <div className="space-y-8">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="gap-2 text-dt-text-muted hover:text-dt-text"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-white via-slate-50 to-slate-100 p-8 shadow-[0_35px_120px_rgba(15,23,42,0.12)] dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 dark:shadow-[0_35px_120px_rgba(0,0,0,0.4)]">
        <div className="absolute inset-0 opacity-90" aria-hidden>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(59,130,246,0.12),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(16,185,129,0.14),transparent_45%)]" />
        </div>
        <div className="relative z-10 flex flex-wrap items-start gap-8">
          <div className="flex items-start gap-6">
            <div className="group relative h-28 w-28 rounded-3xl border border-white/60 bg-dt-surface p-1 shadow-2xl">
              <SecureAvatar
                src={user.avatarUrl}
                alt={user.name || 'Client avatar'}
                size={108}
                fallbackInitial={user.name?.[0]?.toUpperCase() || 'C'}
                containerClassName="h-full w-full overflow-hidden rounded-2xl"
              />
              <div className="absolute inset-0 rounded-3xl border border-blue-300/50 opacity-0 transition group-hover:opacity-100" />
            </div>
            <div className="space-y-3">
              <div className="text-xs uppercase tracking-[0.4em] text-dt-text-muted">Client dossier</div>
              <h1 className="text-3xl font-semibold text-dt-text">{user.name || 'Anonymous Client'}</h1>
              {cp?.companyName && (
                <p className="text-lg text-dt-text-muted">{cp.companyName}</p>
              )}
              <div className="flex flex-wrap gap-3 text-sm text-dt-text-muted">
                {cp?.location && (
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-400" /> {cp.location}
                  </span>
                )}
                {cp?.industry && (
                  <span className="inline-flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-400" /> {cp.industry}
                  </span>
                )}
                {cp?.companySize && <span>Team: {cp.companySize}</span>}
              </div>
              <div className="flex flex-wrap gap-3">
                <Badge
                  variant="secondary"
                  className={cp?.paymentVerified
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-dt-surface-alt text-dt-text-muted'}
                >
                  {cp?.paymentVerified ? 'Payment Verified' : 'Payment Pending'}
                </Badge>
                <Badge variant="outline" className="border-dt-border text-dt-text-muted">
                  Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </Badge>
              </div>
            </div>
          </div>
          <div className="ml-auto flex flex-col items-end gap-3 text-right">
            <p className="text-xs uppercase tracking-[0.4em] text-dt-text-muted">Signals</p>
            <p className="text-sm text-dt-text-muted">Trust indicators help freelancers evaluate opportunities.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {highlightStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/40 bg-dt-surface/70 p-4 text-left shadow-inner dark:border-slate-700">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-dt-text-muted">
                    {stat.icon}
                    <span>{stat.label}</span>
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-dt-text">{stat.value}</div>
                  <p className="text-xs text-dt-text-muted">{stat.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      {cp?.description ? (
        <Card className="border-dt-border bg-dt-surface shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg text-dt-text">About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-base leading-relaxed text-dt-text-muted">{cp.description}</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dt-border bg-dt-surface shadow-lg">
          <CardContent className="py-6 text-sm text-dt-text-muted">
            This client hasn&apos;t written a company narrative yet. Review their hiring history and trust signals to gauge fit.
          </CardContent>
        </Card>
      )}

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-[1.65fr,1fr]">
        <div className="space-y-6">
          {/* Work History */}
          <Card className="border-dt-border bg-dt-surface text-dt-text shadow-xl">
            <CardHeader className="space-y-3">
              <p className="text-xs uppercase tracking-[0.45em] text-dt-text-muted">Hiring track record</p>
              <CardTitle className="flex flex-wrap items-center gap-3 text-2xl text-dt-text">
                <Briefcase className="h-6 w-6 text-emerald-500" /> Completed contracts
              </CardTitle>
              <p className="text-sm text-dt-text-muted">
                Recent engagements help assess collaboration style and payment reliability.
              </p>
            </CardHeader>
            <CardContent>
              {recentContracts.length > 0 ? (
                <div className="space-y-3">
                  {recentContracts.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-2xl border border-slate-100 bg-dt-surface-alt/70 p-4 transition hover:border-emerald-200 dark:border-slate-700 dark:hover:border-emerald-700"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-dt-text">{c.title}</p>
                          <p className="mt-1 text-xs text-dt-text-muted">
                            with {c.freelancer?.name || 'Freelancer'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-emerald-600">
                            ${Number(c.totalAmount).toLocaleString()}
                          </p>
                          {c.completedAt && (
                            <p className="text-xs text-dt-text-muted">
                              {new Date(c.completedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-dt-border bg-dt-surface-alt/70 p-6 text-center text-sm text-dt-text-muted">
                  No completed contracts yet. This client is new to the platform or has active-only engagements.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Verification summary */}
          <Card className="border-dt-border bg-dt-surface text-dt-text shadow-xl">
            <CardHeader className="space-y-3">
              <p className="text-xs uppercase tracking-[0.45em] text-dt-text-muted">Verification</p>
              <CardTitle className="flex items-center gap-3 text-2xl text-dt-text">
                <Shield className="h-6 w-6 text-emerald-500" /> Trust signals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white p-4 dark:border-emerald-900/50 dark:from-emerald-950/30 dark:via-transparent dark:to-transparent">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`h-5 w-5 ${cp?.paymentVerified ? 'text-emerald-500' : 'text-slate-300'}`} />
                    <span className="text-sm font-semibold text-dt-text">Payment method</span>
                  </div>
                  <p className="mt-1 text-xs text-dt-text-muted">
                    {cp?.paymentVerified ? 'Verified — escrow releases unlocked' : 'Not yet verified'}
                  </p>
                </div>
                <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white p-4 dark:border-blue-900/50 dark:from-blue-950/30 dark:via-transparent dark:to-transparent">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-semibold text-dt-text">Talent reviews</span>
                  </div>
                  <p className="mt-1 text-xs text-dt-text-muted">
                    {(cp?.totalReviews ?? 0) > 0
                      ? `${cp!.totalReviews} freelancer${cp!.totalReviews === 1 ? '' : 's'} reviewed this client`
                      : 'No reviews yet — be the first to collaborate'}
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-white p-4 dark:border-amber-900/50 dark:from-amber-950/30 dark:via-transparent dark:to-transparent">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-500" />
                    <span className="text-sm font-semibold text-dt-text">Average rating</span>
                  </div>
                  <p className="mt-1 text-xs text-dt-text-muted">
                    {Number(cp?.avgRating ?? 0) > 0
                      ? `${Number(cp!.avgRating).toFixed(1)} / 5.0 stars`
                      : 'No ratings recorded'}
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 via-white to-white p-4 dark:border-emerald-900/50 dark:from-emerald-950/30 dark:via-transparent dark:to-transparent">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm font-semibold text-dt-text">Spending history</span>
                  </div>
                  <p className="mt-1 text-xs text-dt-text-muted">
                    ${Number(cp?.totalSpent ?? 0).toLocaleString()} invested through smart escrow
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact */}
          <Card className="border-dt-border bg-dt-surface shadow-lg">
            <CardHeader>
              <CardTitle className="text-base text-dt-text">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full bg-emerald-500 text-white shadow-lg shadow-emerald-300/70 hover:bg-emerald-600">
                <Link href={`/messages?to=${user.id}`}>
                  <Mail className="mr-2 h-4 w-4" /> Start a conversation
                </Link>
              </Button>
              <p className="text-xs text-dt-text-muted">
                Direct messaging keeps everything on-chain ready and avoids sharing personal details too early.
              </p>
            </CardContent>
          </Card>

          {/* Company Details */}
          <Card className="border-dt-border bg-dt-surface shadow-lg">
            <CardHeader>
              <CardTitle className="text-base text-dt-text">Company details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-dt-text-muted">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-400" /> Company
                </span>
                <span className="font-semibold text-dt-text">{cp?.companyName || 'Not specified'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dt-text-muted">Industry</span>
                <span className="text-dt-text">{cp?.industry || 'Not set'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dt-text-muted">Team size</span>
                <span className="text-dt-text">{cp?.companySize || 'Not specified'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dt-text-muted">Location</span>
                <span className="text-dt-text">{cp?.location || 'Not set'}</span>
              </div>
              {cp?.companyWebsite && (
                <a
                  href={cp.companyWebsite.startsWith('http') ? cp.companyWebsite : `https://${cp.companyWebsite}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-dt-surface-alt/80 px-4 py-3 text-emerald-700 transition hover:border-emerald-200 hover:bg-dt-surface dark:border-slate-700 dark:text-emerald-400 dark:hover:border-emerald-700"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="font-medium">{getLinkLabel(cp.companyWebsite.startsWith('http') ? cp.companyWebsite : `https://${cp.companyWebsite}`)}</span>
                  </div>
                  <ExternalLink className="h-3 w-3 text-dt-text-muted" />
                </a>
              )}
            </CardContent>
          </Card>

          {/* Hiring Stats Summary */}
          <Card className="border-dt-border bg-dt-surface shadow-lg">
            <CardHeader>
              <CardTitle className="text-base text-dt-text">Hiring summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-dt-text-muted">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-emerald-400" /> Jobs posted
                </span>
                <span className="font-semibold text-dt-text">{cp?.jobsPosted ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dt-text-muted">Hire rate</span>
                <span className="font-semibold text-dt-text">{Number(cp?.hireRate ?? 0)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dt-text-muted">Completed contracts</span>
                <span className="font-semibold text-dt-text">{recentContracts.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dt-text-muted">Total reviews</span>
                <span className="font-semibold text-dt-text">{cp?.totalReviews ?? 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Trust Score Breakdown (Module 4) */}
      {trustScoreBreakdown && trustScoreBreakdown.components.length > 0 && (
        <TrustScoreCard breakdown={trustScoreBreakdown} />
      )}

      {/* Reviews Section */}
      <Card className="border-dt-border bg-dt-surface text-dt-text shadow-xl">
        <CardHeader className="space-y-3">
          <p className="text-xs uppercase tracking-[0.45em] text-dt-text-muted">Reputation</p>
          <CardTitle className="flex items-center gap-3 text-2xl text-dt-text">
            <Star className="h-6 w-6 text-amber-400" /> Reviews & Ratings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {reviewSummary && <ReviewSummaryCard summary={reviewSummary} subjectRole="CLIENT" />}
          <ReviewList
            reviews={reviewsData?.items ?? []}
            emptyMessage="No reviews yet. Reviews will appear here once contracts are completed."
          />
        </CardContent>
      </Card>
    </div>
  );
}
