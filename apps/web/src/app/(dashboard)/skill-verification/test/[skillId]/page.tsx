'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Send,
  ShieldCheck,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { userApi } from '@/lib/api/user';
import { cn } from '@/lib/utils';

interface Question {
  id: string;
  text: string;
  options: string[];
  difficulty: string;
}

interface QuizData {
  testId: string;
  skillName: string;
  skillCategory: string;
  questions: Question[];
  timeLimit: number;
  passingScore: number;
}

export default function SkillTestPage() {
  const params = useParams();
  const router = useRouter();
  const skillId = params.skillId as string;

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

  // Load quiz from sessionStorage
  useEffect(() => {
    const raw = sessionStorage.getItem('activeQuiz');
    if (!raw) {
      router.replace('/skill-verification');
      return;
    }
    try {
      const data = JSON.parse(raw) as QuizData;
      setQuiz(data);
      setSecondsLeft(data.timeLimit * 60);
      startTimeRef.current = Date.now();
    } catch {
      router.replace('/skill-verification');
    }
  }, [router]);

  // Countdown timer
  useEffect(() => {
    if (!quiz || submitted || secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [quiz, submitted, secondsLeft]);

  // Auto-submit when timer expires
  useEffect(() => {
    if (secondsLeft === 0 && quiz && !submitted && !submitting) {
      void handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  const handleAnswer = useCallback((questionId: string, option: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!quiz || submitting) return;
    setSubmitting(true);

    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);

    const formattedAnswers = quiz.questions.map(q => ({
      question_id: q.id,
      selected_answer: answers[q.id] ?? '',
    }));

    try {
      const response = await userApi.submitSkillVerification(skillId, {
        testId: quiz.testId,
        answers: formattedAnswers,
        timeTaken,
      });
      const data = response.data;
      if (!data) throw new Error('No data in response');
      // Store result for the results page
      sessionStorage.setItem('quizResult', JSON.stringify({
        ...data,
        skillName: quiz.skillName,
        skillId,
      }));
      sessionStorage.removeItem('activeQuiz');
      setSubmitted(true);
      router.push(`/skill-verification/result/${data.attemptId}`);
    } catch (err: any) {
      alert(err?.message ?? 'Failed to submit test');
      setSubmitting(false);
    }
  }, [quiz, answers, skillId, submitting, router]);

  if (!quiz) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === quiz.questions.length;
  const progressPercent = (answeredCount / quiz.questions.length) * 100;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isLowTime = secondsLeft < 60;

  const difficultyColor = {
    easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
    hard: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
  }[currentQuestion.difficulty] ?? 'bg-slate-100 text-slate-600';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Timer + Progress Bar */}
      <div className="sticky top-0 z-20 rounded-2xl border border-dt-border bg-dt-surface/95 p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-violet-500" />
            <span className="text-sm font-medium text-dt-text">{quiz.skillName} Verification</span>
          </div>
          <div className={cn(
            'flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-mono font-bold',
            isLowTime
              ? 'bg-red-100 text-red-700 animate-pulse dark:bg-red-950/50 dark:text-red-400'
              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
          )}>
            <Clock className="h-4 w-4" />
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <span className="text-sm text-dt-text-muted">
            Q {currentIdx + 1} of {quiz.questions.length}
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <Card className="border-dt-border bg-dt-surface shadow-xl">
        <CardContent className="p-8">
          <div className="mb-6 flex items-center justify-between">
            <Badge className={difficultyColor}>
              {currentQuestion.difficulty}
            </Badge>
            {answers[currentQuestion.id] && (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            )}
          </div>
          <h2 className="mb-8 text-lg font-medium leading-relaxed text-dt-text">
            {currentQuestion.text}
          </h2>
          <div className="space-y-3">
            {currentQuestion.options.map((option, i) => {
              const letter = String.fromCharCode(65 + i); // A, B, C, D
              const isSelected = answers[currentQuestion.id] === letter;
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(currentQuestion.id, letter)}
                  className={cn(
                    'flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all',
                    isSelected
                      ? 'border-violet-300 bg-violet-50 ring-2 ring-violet-200 dark:border-violet-700 dark:bg-violet-950/30 dark:ring-violet-800'
                      : 'border-dt-border bg-dt-surface-alt/30 hover:border-violet-200 hover:bg-violet-50/30 dark:hover:border-violet-800 dark:hover:bg-violet-950/10',
                  )}
                >
                  <div className={cn(
                    'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all',
                    isSelected
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  )}>
                    {letter}
                  </div>
                  <span className={cn(
                    'text-sm',
                    isSelected ? 'font-medium text-violet-700 dark:text-violet-300' : 'text-dt-text'
                  )}>
                    {option}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
          disabled={currentIdx === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Previous
        </Button>

        {/* Question dots */}
        <div className="flex gap-1.5">
          {quiz.questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentIdx(i)}
              className={cn(
                'h-3 w-3 rounded-full transition-all',
                i === currentIdx
                  ? 'scale-125 bg-violet-600'
                  : answers[q.id]
                    ? 'bg-emerald-400'
                    : 'bg-slate-200 dark:bg-slate-700'
              )}
            />
          ))}
        </div>

        {currentIdx < quiz.questions.length - 1 ? (
          <Button
            variant="outline"
            onClick={() => setCurrentIdx(prev => Math.min(quiz.questions.length - 1, prev + 1))}
          >
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            className="bg-violet-600 text-white hover:bg-violet-700"
            onClick={() => void handleSubmit()}
            disabled={submitting || !allAnswered}
          >
            {submitting ? (
              <><Spinner size="sm" className="mr-2" /> Submitting...</>
            ) : (
              <><Send className="mr-2 h-4 w-4" /> Submit Test</>
            )}
          </Button>
        )}
      </div>

      {!allAnswered && currentIdx === quiz.questions.length - 1 && (
        <p className="text-center text-sm text-amber-600 dark:text-amber-400">
          <AlertTriangle className="mr-1 inline h-4 w-4" />
          Answer all {quiz.questions.length} questions to submit ({quiz.questions.length - answeredCount} remaining)
        </p>
      )}
    </div>
  );
}
