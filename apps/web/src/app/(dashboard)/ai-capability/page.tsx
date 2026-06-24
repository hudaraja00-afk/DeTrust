'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  Activity,
  Award,
  BarChart3,
  Brain,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Clock3,
  DollarSign,
  GraduationCap,
  Layers,
  MapPin,
  RefreshCw,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useCurrentUser } from '@/hooks/queries/use-user';
import { useAuthStore } from '@/store/auth.store';
import { userApi } from '@/lib/api/user';
import { cn } from '@/lib/utils';

type CapabilityLevel = 'Beginner' | 'Intermediate' | 'Expert' | 'Unrated';

function getCapabilityLevel(score: number): CapabilityLevel {
  if (score <= 0) return 'Unrated';
  if (score < 35) return 'Beginner';
  if (score < 70) return 'Intermediate';
  return 'Expert';
}

function getLevelConfig(level: CapabilityLevel) {
  switch (level) {
    case 'Expert':
      return {
        color: 'text-amber-500',
        bg: 'bg-gradient-to-br from-amber-50 via-amber-100/50 to-white dark:from-amber-950/30 dark:via-amber-900/20 dark:to-transparent',
        border: 'border-amber-200 dark:border-amber-800',
        badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
        ring: 'ring-amber-200 dark:ring-amber-800',
        gradient: 'from-amber-500 to-orange-500',
        icon: <Award className="h-8 w-8 text-amber-500" />,
        description: 'You\'re among the top-tier talent on DeTrust. Your skills, experience, and track record set you apart.',
      };
    case 'Intermediate':
      return {
        color: 'text-blue-500',
        bg: 'bg-gradient-to-br from-blue-50 via-blue-100/50 to-white dark:from-blue-950/30 dark:via-blue-900/20 dark:to-transparent',
        border: 'border-blue-200 dark:border-blue-800',
        badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
        ring: 'ring-blue-200 dark:ring-blue-800',
        gradient: 'from-blue-500 to-cyan-500',
        icon: <TrendingUp className="h-8 w-8 text-blue-500" />,
        description: 'You have solid fundamentals and growing experience. Keep building your portfolio to reach Expert level.',
      };
    case 'Beginner':
      return {
        color: 'text-emerald-500',
        bg: 'bg-gradient-to-br from-emerald-50 via-emerald-100/50 to-white dark:from-emerald-950/30 dark:via-emerald-900/20 dark:to-transparent',
        border: 'border-emerald-200 dark:border-emerald-800',
        badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
        ring: 'ring-emerald-200 dark:ring-emerald-800',
        gradient: 'from-emerald-500 to-teal-500',
        icon: <Sparkles className="h-8 w-8 text-emerald-500" />,
        description: 'You\'re just getting started! Complete your profile and land your first contracts to level up.',
      };
    default:
      return {
        color: 'text-slate-400',
        bg: 'bg-gradient-to-br from-slate-50 via-slate-100/50 to-white dark:from-slate-950/30 dark:via-slate-900/20 dark:to-transparent',
        border: 'border-slate-200 dark:border-slate-700',
        badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
        ring: 'ring-slate-200 dark:ring-slate-700',
        gradient: 'from-slate-400 to-slate-500',
        icon: <Clock3 className="h-8 w-8 text-slate-400" />,
        description: 'Your AI capability hasn\'t been calculated yet. Complete your profile to get started.',
      };
  }
}

export default function AiCapabilityPage() {
  const { user } = useAuthStore();
  const { isLoading, refetch, isFetching } = useCurrentUser();
  const [isRecalculating, setIsRecalculating] = useState(false);

  const profile = user?.freelancerProfile;
  const score = profile?.aiCapabilityScore ?? 0;
  const level = getCapabilityLevel(score);
  const config = getLevelConfig(level);
  const isUsingColdStart = (profile?.completedJobs ?? 0) < 2;

  const handleRecalculate = useCallback(async () => {
    setIsRecalculating(true);
    try {
      await userApi.recalculateAiCapability();
      await refetch();
    } catch {
      // Silently fail — score just doesn't update
    } finally {
      setIsRecalculating(false);
    }
  }, [refetch]);

  // Experience years calculation (mirrors the backend logic)
  const expYears = useMemo(() => {
    if (!profile?.experience?.length) return 0;
    return profile.experience.reduce((sum, exp) => {
      const start = new Date(exp.startDate).getTime();
      const end = exp.endDate ? new Date(exp.endDate).getTime() : Date.now();
      return sum + (end - start) / (1000 * 60 * 60 * 24 * 365);
    }, 0);
  }, [profile?.experience]);

  const signals = useMemo(() => {
    if (!profile) return [];

    const hourlyRate = Number(profile.hourlyRate ?? 0);
    const primarySkill = profile.skills?.[0]?.skill?.category ?? 'Not set';

    return [
      {
        label: 'Hourly Rate',
        value: hourlyRate > 0 ? `$${hourlyRate}` : 'Not set',
        target: '> $0',
        icon: <DollarSign className="h-5 w-5 text-emerald-500" />,
        met: hourlyRate > 0,
        tip: 'Set your hourly rate — key signal for the cold-start model',
        showRaw: true,
      },
      {
        label: 'Experience',
        value: expYears > 0 ? `${Math.round(expYears * 10) / 10} yrs` : '0 yrs',
        target: '> 0 yrs',
        icon: <Briefcase className="h-5 w-5 text-purple-500" />,
        met: expYears > 0,
        tip: 'Work experience duration is the strongest cold-start signal',
        showRaw: true,
      },
      {
        label: 'Primary Skill',
        value: primarySkill,
        target: 'Set',
        icon: <Layers className="h-5 w-5 text-blue-500" />,
        met: (profile.skills?.length ?? 0) >= 1,
        tip: 'Your first skill\'s category feeds into the model',
        showRaw: true,
      },
      {
        label: 'Client Rating',
        value: (profile.avgRating ?? 0) > 0 ? `${profile.avgRating}/5` : 'No reviews yet',
        target: '> 0',
        icon: <Star className="h-5 w-5 text-amber-500" />,
        met: (profile.avgRating ?? 0) > 0,
        tip: isUsingColdStart ? 'Neutral default (3.0) used until you get real reviews' : 'Avg client rating',
        showRaw: true,
      },
      {
        label: 'Skills Count',
        value: `${profile.skills?.length ?? 0}`,
        target: '≥ 3',
        icon: <Layers className="h-5 w-5 text-cyan-500" />,
        met: (profile.skills?.length ?? 0) >= 3,
        tip: 'Having 3+ skills improves profile completeness',
        showRaw: true,
      },
      {
        label: 'Completed Jobs',
        value: `${profile.completedJobs ?? 0}`,
        target: '≥ 2',
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
        met: (profile.completedJobs ?? 0) >= 2,
        tip: 'Complete 2+ contracts to unlock the performance model',
        showRaw: true,
      },
    ];
  }, [profile, expYears, isUsingColdStart]);

  const signalsMet = signals.filter(s => s.met).length;
  const totalSignals = signals.length;

  if (!user && isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (user?.role !== 'FREELANCER') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-10 space-y-4">
          <Brain className="h-12 w-12 text-slate-300" />
          <p className="text-sm text-dt-text-muted">AI Capability is only available for freelancers.</p>
          <Button asChild><Link href="/dashboard">Back to Dashboard</Link></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className={cn('relative overflow-hidden rounded-[32px] p-8 shadow-xl', config.bg, config.border, 'border')}>
        <div className="absolute inset-0 opacity-30" aria-hidden>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.1),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(16,185,129,0.1),transparent_55%)]" />
        </div>
        <div className="relative z-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.5em] text-dt-text-muted">Module 6 · AI Capability Prediction</p>
              <div className="flex items-center gap-4">
                <div className={cn('flex h-16 w-16 items-center justify-center rounded-2xl bg-white/80 shadow-lg ring-2 dark:bg-slate-800/80', config.ring)}>
                  {config.icon}
                </div>
                <div>
                  <h1 className="text-3xl font-semibold text-dt-text">AI Capability Score</h1>
                  <p className="mt-1 text-sm text-dt-text-muted">{config.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className={cn('text-sm', config.badge)}>{level}</Badge>
                <Badge variant="outline" className="border-dt-border text-dt-text-muted">
                  <Brain className="mr-1 h-3.5 w-3.5" /> XGBoost Classification
                </Badge>
                <Badge variant="outline" className="border-dt-border text-dt-text-muted">
                  <Activity className="mr-1 h-3.5 w-3.5" /> {(profile?.completedJobs ?? 0) >= 2 ? 'Performance Model' : 'Cold-Start Model'}
                </Badge>
              </div>
            </div>

            {/* Score Ring */}
            <div className="flex flex-col items-center">
              <div className="relative h-40 w-40">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-800" />
                  <circle
                    cx="60" cy="60" r="52" fill="none" strokeWidth="8" strokeLinecap="round"
                    className={cn('transition-all duration-1000', config.color)}
                    strokeDasharray={`${(score / 100) * 2 * Math.PI * 52} ${2 * Math.PI * 52}`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-dt-text">{score}</span>
                  <span className="text-xs text-dt-text-muted">out of 100</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-xs text-dt-text-muted"
                onClick={() => void handleRecalculate()}
                disabled={isRecalculating || isFetching}
              >
                <RefreshCw className={cn('mr-1.5 h-3.5 w-3.5', (isRecalculating || isFetching) && 'animate-spin')} />
                {isRecalculating ? 'Recalculating...' : 'Refresh Score'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        {/* Signal Strength */}
        <Card className="border-dt-border bg-dt-surface shadow-xl">
          <CardHeader className="space-y-3">
            <p className="text-xs uppercase tracking-[0.45em] text-dt-text-muted">Profile signals</p>
            <CardTitle className="flex items-center gap-3 text-2xl text-dt-text">
              <Zap className="h-6 w-6 text-emerald-500" /> Signal strength
            </CardTitle>
            <p className="text-sm text-dt-text-muted">
              The AI model analyzes these signals to determine your capability level.
              Stronger signals lead to higher scores.
            </p>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
                  style={{ width: `${(signalsMet / totalSignals) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-dt-text">{signalsMet}/{totalSignals}</span>
            </div>

            <div className="space-y-3">
              {signals.map((signal) => (
                <div
                  key={signal.label}
                  className={cn(
                    'flex items-center justify-between rounded-2xl border p-4 transition-all',
                    signal.met
                      ? 'border-emerald-100 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20'
                      : 'border-dt-border bg-dt-surface-alt/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {signal.icon}
                    <div>
                      <p className="text-sm font-medium text-dt-text">{signal.label}</p>
                      <p className="text-xs text-dt-text-muted">{signal.tip}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'text-sm font-semibold',
                      signal.met ? 'text-emerald-600 dark:text-emerald-400' : 'text-dt-text-muted'
                    )}>
                      {signal.value}
                    </span>
                    {signal.met ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-slate-200 dark:border-slate-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-6">
          {/* How it works */}
          <Card className="border-dt-border bg-dt-surface shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-dt-text">
                <Brain className="h-5 w-5 text-fuchsia-500" /> How it works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-dt-text-muted">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">1</div>
                  <div>
                    <p className="font-medium text-dt-text">Profile Analysis</p>
                    <p>Your skills, experience, education, and portfolio are extracted as feature signals.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">2</div>
                  <div>
                    <p className="font-medium text-dt-text">Model Selection</p>
                    <p>New users use the <strong>Cold-Start</strong> model (profile only). After 2+ contracts, the <strong>Performance</strong> model kicks in using job history.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">3</div>
                  <div>
                    <p className="font-medium text-dt-text">Classification</p>
                    <p>An XGBoost classifier predicts your level: <strong>Beginner</strong>, <strong>Intermediate</strong>, or <strong>Expert</strong> with a confidence percentage.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Model Stats */}
          <Card className="border-dt-border bg-dt-surface shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-dt-text">
                <BarChart3 className="h-5 w-5 text-cyan-500" /> Model performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-100 bg-dt-surface-alt/70 p-4 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-dt-text-muted">Cold-Start Model</p>
                      <p className="text-sm text-dt-text-muted">Profile-only features (35 signals)</p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">94.2% F1</Badge>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-dt-surface-alt/70 p-4 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-dt-text-muted">Performance Model</p>
                      <p className="text-sm text-dt-text-muted">Contract history features (27 signals)</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">99.3% F1</Badge>
                  </div>
                </div>
                <p className="text-xs text-dt-text-muted">
                  Currently using: <strong>{(profile?.completedJobs ?? 0) >= 2 ? 'Performance' : 'Cold-Start'}</strong> model
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Improve Score */}
          <Card className="border-dt-border bg-dt-surface shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-dt-text">
                <Star className="h-5 w-5 text-amber-500" /> Boost your score
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!signals[0].met && (
                <Link href="/profile/edit" className="flex items-center justify-between rounded-2xl border border-dt-border bg-dt-surface-alt/50 p-3 text-sm transition hover:border-emerald-200 hover:bg-emerald-50/50 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30">
                  <span className="text-dt-text">Add more skills (need 3+)</span>
                  <ChevronRight className="h-4 w-4 text-dt-text-muted" />
                </Link>
              )}
              {!signals[2].met && (
                <Link href="/profile/edit" className="flex items-center justify-between rounded-2xl border border-dt-border bg-dt-surface-alt/50 p-3 text-sm transition hover:border-emerald-200 hover:bg-emerald-50/50 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30">
                  <span className="text-dt-text">Add work experience</span>
                  <ChevronRight className="h-4 w-4 text-dt-text-muted" />
                </Link>
              )}
              {!signals[3].met && (
                <Link href="/profile/edit" className="flex items-center justify-between rounded-2xl border border-dt-border bg-dt-surface-alt/50 p-3 text-sm transition hover:border-emerald-200 hover:bg-emerald-50/50 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30">
                  <span className="text-dt-text">Showcase a portfolio project</span>
                  <ChevronRight className="h-4 w-4 text-dt-text-muted" />
                </Link>
              )}
              {!signals[5].met && (
                <Link href="/jobs" className="flex items-center justify-between rounded-2xl border border-dt-border bg-dt-surface-alt/50 p-3 text-sm transition hover:border-emerald-200 hover:bg-emerald-50/50 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30">
                  <span className="text-dt-text">Complete contracts to unlock Performance model</span>
                  <ChevronRight className="h-4 w-4 text-dt-text-muted" />
                </Link>
              )}
              {signalsMet === totalSignals && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">All signals active!</span>
                  </div>
                  <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">Keep delivering quality work to maintain and improve your Expert status.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
