'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  ChevronRight,
  Clock,
  ShieldCheck,
  ShieldX,
  Timer,
  Trophy,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useCurrentUser } from '@/hooks/queries/use-user';
import { useAuthStore } from '@/store/auth.store';
import { userApi } from '@/lib/api/user';
import { cn } from '@/lib/utils';

interface SkillTestAttempt {
  id: string;
  score: number;
  passed: boolean;
  timeTaken: number;
  completedAt: string;
  test: {
    skillId: string;
    name: string;
    passingScore: number;
  };
}

export default function SkillVerificationPage() {
  const { user } = useAuthStore();
  const { isLoading } = useCurrentUser();
  const router = useRouter();
  const [history, setHistory] = useState<SkillTestAttempt[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [startingSkillId, setStartingSkillId] = useState<string | null>(null);

  const profile = user?.freelancerProfile;
  const skills = profile?.skills ?? [];

  // Load test history
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await userApi.getSkillTestHistory();
        setHistory((res.data ?? []) as any);
      } catch {
        // silently fail
      } finally {
        setLoadingHistory(false);
      }
    }
    if (user?.role === 'FREELANCER') void loadHistory();
  }, [user?.role]);

  // Build enriched skill list with verification info
  const enrichedSkills = useMemo(() => {
    return skills.map((fs: any) => {
      const lastAttempt = history.find(h => h.test.skillId === fs.skill.id);
      const cooldownEnd = lastAttempt
        ? new Date(new Date(lastAttempt.completedAt).getTime() + 30 * 24 * 60 * 60 * 1000)
        : null;
      const isOnCooldown = cooldownEnd ? cooldownEnd > new Date() : false;
      const daysUntilRetake = isOnCooldown && cooldownEnd
        ? Math.ceil((cooldownEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        id: fs.skill.id,
        name: fs.skill.name,
        category: fs.skill.category,
        verificationStatus: fs.verificationStatus ?? 'UNVERIFIED',
        verificationScore: fs.verificationScore,
        verifiedAt: fs.verifiedAt,
        lastAttempt,
        isOnCooldown,
        daysUntilRetake,
      };
    });
  }, [skills, history]);

  const verifiedCount = enrichedSkills.filter(s => s.verificationStatus === 'VERIFIED').length;
  const totalSkills = enrichedSkills.length;

  // Stats
  const stats = useMemo(() => {
    if (history.length === 0) return { taken: 0, passRate: 0, avgScore: 0 };
    const passed = history.filter(h => h.passed).length;
    const avgScore = Math.round(history.reduce((s, h) => s + h.score, 0) / history.length);
    return {
      taken: history.length,
      passRate: Math.round((passed / history.length) * 100),
      avgScore,
    };
  }, [history]);

  const handleStartTest = async (skillId: string) => {
    setStartingSkillId(skillId);
    try {
      const res = await userApi.startSkillVerification(skillId);
      if (!res.data) throw new Error(res.error?.message ?? 'Failed to start test');
      // Store quiz data in sessionStorage for the test page
      sessionStorage.setItem('activeQuiz', JSON.stringify(res.data));
      router.push(`/skill-verification/test/${skillId}`);
    } catch (err: any) {
      alert(err?.message ?? 'Failed to start test. Is the AI service running?');
      setStartingSkillId(null);
    }
  };

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
          <ShieldCheck className="h-12 w-12 text-slate-300" />
          <p className="text-sm text-dt-text-muted">Skill Verification is only available for freelancers.</p>
          <Button asChild><Link href="/dashboard">Back to Dashboard</Link></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[32px] border border-dt-border bg-gradient-to-br from-violet-50 via-indigo-50/50 to-white p-8 shadow-xl dark:from-violet-950/30 dark:via-indigo-900/20 dark:to-transparent">
        <div className="absolute inset-0 opacity-30" aria-hidden>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(139,92,246,0.15),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(99,102,241,0.1),transparent_55%)]" />
        </div>
        <div className="relative z-10">
          <p className="text-xs uppercase tracking-[0.5em] text-dt-text-muted">Module 6 · Skill Verification</p>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/80 shadow-lg ring-2 ring-violet-200 dark:bg-slate-800/80 dark:ring-violet-800">
              <ShieldCheck className="h-8 w-8 text-violet-500" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-dt-text">Skill Verification</h1>
              <p className="mt-1 text-sm text-dt-text-muted">
                Take AI-generated quizzes to earn verified badges on your skills. Verified skills boost your AI Capability score.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
              {verifiedCount}/{totalSkills} Verified
            </Badge>
            <Badge variant="outline" className="border-dt-border text-dt-text-muted">
              <Zap className="mr-1 h-3.5 w-3.5" /> Gemini Flash AI
            </Badge>
            <Badge variant="outline" className="border-dt-border text-dt-text-muted">
              <Timer className="mr-1 h-3.5 w-3.5" /> 10 min / 10 MCQs
            </Badge>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        {/* Skill List */}
        <Card className="border-dt-border bg-dt-surface shadow-xl">
          <CardHeader className="space-y-3">
            <p className="text-xs uppercase tracking-[0.45em] text-dt-text-muted">Your Skills</p>
            <CardTitle className="flex items-center justify-between text-2xl text-dt-text">
              <span className="flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-violet-500" /> Verification Status
              </span>
              <span className="text-sm font-normal text-dt-text-muted">{verifiedCount} verified / {totalSkills}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalSkills === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <ShieldX className="h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm text-dt-text-muted">No skills added yet. Add skills to your profile first.</p>
                <Button asChild className="mt-4" variant="outline">
                  <Link href="/profile">Go to Profile</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {enrichedSkills.map((skill) => (
                  <div
                    key={skill.id}
                    className={cn(
                      'flex items-center justify-between rounded-2xl border p-4 transition-all',
                      skill.verificationStatus === 'VERIFIED'
                        ? 'border-emerald-100 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20'
                        : 'border-dt-border bg-dt-surface-alt/50 hover:border-violet-200 dark:hover:border-violet-800',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {skill.verificationStatus === 'VERIFIED' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : skill.verificationStatus === 'PENDING' ? (
                        <Clock className="h-5 w-5 text-amber-500 animate-pulse" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-slate-200 dark:border-slate-600" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-dt-text">{skill.name}</p>
                        <p className="text-xs text-dt-text-muted">{skill.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {skill.verificationStatus === 'VERIFIED' && (
                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          {skill.verificationScore}%
                        </span>
                      )}
                      {skill.verificationStatus === 'VERIFIED' ? (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                          Verified
                        </Badge>
                      ) : skill.isOnCooldown ? (
                        <Badge variant="outline" className="border-amber-200 text-amber-600 dark:border-amber-800 dark:text-amber-400">
                          <Clock className="mr-1 h-3 w-3" /> {skill.daysUntilRetake}d
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-violet-600 text-white hover:bg-violet-700"
                          onClick={() => void handleStartTest(skill.id)}
                          disabled={startingSkillId === skill.id}
                        >
                          {startingSkillId === skill.id ? (
                            <><Spinner size="sm" className="mr-1" /> Generating...</>
                          ) : (
                            <>Take Test <ChevronRight className="ml-1 h-4 w-4" /></>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-6">
          {/* How it works */}
          <Card className="border-dt-border bg-dt-surface shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-dt-text">
                <Zap className="h-5 w-5 text-violet-500" /> How it works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-dt-text-muted">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700 dark:bg-violet-950/50 dark:text-violet-400">1</div>
                  <div>
                    <p className="font-medium text-dt-text">Take a Test</p>
                    <p>Click "Take Test" on any skill. Gemini AI generates 10 unique MCQs tailored to that skill.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400">2</div>
                  <div>
                    <p className="font-medium text-dt-text">Answer in 10 Minutes</p>
                    <p>You have 10 minutes to answer all questions. The timer auto-submits when it expires.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">3</div>
                  <div>
                    <p className="font-medium text-dt-text">Score 70%+ to Earn Badge</p>
                    <p>Pass with 70% or higher and your skill gets a <strong>Verified</strong> badge visible to clients.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="border-dt-border bg-dt-surface shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-dt-text">
                <Trophy className="h-5 w-5 text-amber-500" /> Your Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-dt-text">{stats.taken}</p>
                  <p className="text-xs text-dt-text-muted">Tests Taken</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-dt-text">{stats.passRate}%</p>
                  <p className="text-xs text-dt-text-muted">Pass Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-dt-text">{stats.avgScore}%</p>
                  <p className="text-xs text-dt-text-muted">Avg Score</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Attempts */}
          {history.length > 0 && (
            <Card className="border-dt-border bg-dt-surface shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-dt-text">
                  <Award className="h-5 w-5 text-cyan-500" /> Recent Attempts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {history.slice(0, 5).map((attempt) => (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between rounded-xl border border-dt-border bg-dt-surface-alt/50 p-3 text-sm"
                    >
                      <div>
                        <p className="font-medium text-dt-text">{attempt.test.name.replace(' Verification', '')}</p>
                        <p className="text-xs text-dt-text-muted">
                          {new Date(attempt.completedAt).toLocaleDateString()} · {Math.floor(attempt.timeTaken / 60)}m {attempt.timeTaken % 60}s
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'text-sm font-semibold',
                          attempt.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500',
                        )}>
                          {attempt.score}%
                        </span>
                        {attempt.passed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <ShieldX className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
