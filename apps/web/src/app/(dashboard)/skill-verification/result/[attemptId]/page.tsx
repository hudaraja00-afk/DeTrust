'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  ShieldCheck,
  ShieldX,
  Trophy,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

interface QuizResult {
  attemptId: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  passed: boolean;
  timeTaken: number;
  skillName: string;
  skillId: string;
}

export default function SkillTestResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('quizResult');
    if (!raw) {
      router.replace('/skill-verification');
      return;
    }
    try {
      setResult(JSON.parse(raw));
    } catch {
      router.replace('/skill-verification');
    }
  }, [router]);

  if (!result) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const minutes = Math.floor(result.timeTaken / 60);
  const seconds = result.timeTaken % 60;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Result Hero */}
      <Card className={cn(
        'overflow-hidden border shadow-xl',
        result.passed
          ? 'border-emerald-200 dark:border-emerald-800'
          : 'border-red-200 dark:border-red-800'
      )}>
        <div className={cn(
          'relative p-10 text-center',
          result.passed
            ? 'bg-gradient-to-br from-emerald-50 via-emerald-100/50 to-white dark:from-emerald-950/40 dark:via-emerald-900/20 dark:to-transparent'
            : 'bg-gradient-to-br from-red-50 via-red-100/50 to-white dark:from-red-950/40 dark:via-red-900/20 dark:to-transparent'
        )}>
          <div className="absolute inset-0 opacity-20" aria-hidden>
            <div className={cn(
              'absolute inset-0',
              result.passed
                ? 'bg-[radial-gradient(circle_at_50%_30%,rgba(16,185,129,0.2),transparent_60%)]'
                : 'bg-[radial-gradient(circle_at_50%_30%,rgba(239,68,68,0.2),transparent_60%)]'
            )} />
          </div>
          <div className="relative z-10 space-y-6">
            {/* Icon */}
            <div className={cn(
              'mx-auto flex h-24 w-24 items-center justify-center rounded-full shadow-lg',
              result.passed
                ? 'bg-emerald-100 dark:bg-emerald-950/50'
                : 'bg-red-100 dark:bg-red-950/50'
            )}>
              {result.passed ? (
                <Trophy className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <XCircle className="h-12 w-12 text-red-500 dark:text-red-400" />
              )}
            </div>

            {/* Title */}
            <div>
              <h1 className={cn(
                'text-3xl font-bold',
                result.passed
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-red-700 dark:text-red-300'
              )}>
                {result.passed ? '🎉 Verified!' : 'Not Passed'}
              </h1>
              <p className="mt-2 text-lg text-dt-text-muted">
                {result.passed
                  ? `Your "${result.skillName}" skill is now verified!`
                  : `You needed 70% to pass. Try again in 30 days.`
                }
              </p>
            </div>

            {/* Score Display */}
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <p className={cn(
                  'text-5xl font-bold',
                  result.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                )}>
                  {result.score}%
                </p>
                <p className="text-sm text-dt-text-muted">Your Score</p>
              </div>
              <div className="h-16 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="text-center">
                <p className="text-2xl font-bold text-dt-text">{result.correctCount}/{result.totalQuestions}</p>
                <p className="text-sm text-dt-text-muted">Correct</p>
              </div>
              <div className="h-16 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="text-center">
                <p className="text-2xl font-bold text-dt-text">{minutes}m {seconds}s</p>
                <p className="text-sm text-dt-text-muted">Time Taken</p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex justify-center gap-3">
              <Badge className={cn(
                result.passed
                  ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                  : 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200'
              )}>
                {result.passed ? (
                  <><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Passed</>
                ) : (
                  <><XCircle className="mr-1 h-3.5 w-3.5" /> Failed</>
                )}
              </Badge>
              <Badge variant="outline" className="border-dt-border text-dt-text-muted">
                Passing Score: 70%
              </Badge>
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          {result.passed ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="font-medium text-emerald-700 dark:text-emerald-300">
                    Verification Badge Earned
                  </p>
                  <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80">
                    This badge is visible to clients on your profile and boosts your AI Capability score.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
              <div className="flex items-center gap-3">
                <ShieldX className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="font-medium text-amber-700 dark:text-amber-300">
                    Cooldown Active
                  </p>
                  <p className="text-sm text-amber-600/80 dark:text-amber-400/80">
                    You can retake this test in 30 days. Use this time to strengthen your {result.skillName} knowledge.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-6 flex gap-4">
            <Button asChild className="flex-1" variant="outline">
              <Link href="/skill-verification">
                <Award className="mr-2 h-4 w-4" /> View All Skills
              </Link>
            </Button>
            <Button asChild className="flex-1 bg-violet-600 text-white hover:bg-violet-700">
              <Link href="/ai-capability">
                AI Capability <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
