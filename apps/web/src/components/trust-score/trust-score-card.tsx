'use client';

import { Shield, ShieldOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TRUST_SCORE_EXCELLENT, TRUST_SCORE_GOOD } from '@/lib/review-utils';
import { cn } from '@/lib/utils';
import type { TrustScoreBreakdown } from '@/lib/api/user';

interface TrustScoreCardProps {
  breakdown: TrustScoreBreakdown;
  className?: string;
}

function getScoreColor(score: number | null): string {
  if (score === null || score === 0) return 'text-slate-400';
  if (score > TRUST_SCORE_EXCELLENT) return 'text-emerald-500';
  if (score >= TRUST_SCORE_GOOD) return 'text-blue-500';
  if (score > 0) return 'text-amber-500';
  return 'text-slate-400';
}

function getBarColor(score: number): string {
  if (score > TRUST_SCORE_EXCELLENT) return 'bg-emerald-500';
  if (score >= TRUST_SCORE_GOOD) return 'bg-blue-500';
  if (score > 0) return 'bg-amber-500';
  return 'bg-slate-300';
}

export function TrustScoreCard({ breakdown, className }: TrustScoreCardProps) {
  // Ineligible state — not enough contracts
  if (!breakdown.eligible) {
    const current = breakdown.currentContracts ?? 0;
    const minimum = breakdown.minimumContracts ?? 5;
    const progress = Math.round((current / minimum) * 100);

    return (
      <Card className={cn('border-dashed border-dt-border bg-dt-surface shadow-lg', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-dt-text-muted">
            <ShieldOff className="h-5 w-5 text-slate-400" />
            Trust Score
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-slate-400">—</div>
            <div>
              <p className="text-sm font-medium text-dt-text">Not Yet Eligible</p>
              <p className="text-xs text-dt-text-muted">
                Complete {minimum - current} more contract{minimum - current !== 1 ? 's' : ''} to unlock your trust score
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-dt-text-muted">Progress</span>
              <span className="font-medium text-dt-text">{current}/{minimum} contracts</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const score = breakdown.totalScore ?? 0;
  const positiveComponents = breakdown.components.filter((c) => c.weight > 0);
  const penaltyComponents = breakdown.components.filter((c) => c.weightedValue < 0);
  // Info components that render with a progress bar (e.g. Dispute Win Rate)
  const infoBarComponents = breakdown.components.filter(
    (c) => c.weight === 0 && c.weightedValue >= 0 && c.label === 'Dispute Win Rate',
  );
  // Text-only info components (e.g. Dispute Record, Cancellation Penalty at 0)
  const infoTextComponents = breakdown.components.filter(
    (c) => c.weight === 0 && c.weightedValue >= 0 && c.label !== 'Dispute Win Rate',
  );

  return (
    <Card className={cn('border-dt-border bg-dt-surface shadow-lg', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-dt-text">
          <Shield className="h-5 w-5 text-emerald-500" />
          Trust Score Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div className="flex items-center gap-4">
          <div className={cn('text-4xl font-bold', getScoreColor(score))}>
            {score > 0 ? score.toFixed(1) : '—'}
          </div>
          <div>
            <p className="text-sm font-medium text-dt-text">Overall Trust Score</p>
            <p className="text-xs text-dt-text-muted">
              {score > TRUST_SCORE_EXCELLENT
                ? 'Excellent — highly trusted'
                : score >= TRUST_SCORE_GOOD
                  ? 'Good — building credibility'
                  : score > 0
                    ? 'Developing — keep improving'
                    : 'No data yet'}
            </p>
          </div>
        </div>

        {/* Positive Component Breakdown */}
        {positiveComponents.length > 0 && (
          <div className="space-y-3 border-t border-dt-border pt-4">
            {positiveComponents.map((component) => (
              <div key={component.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-dt-text-muted">
                    {component.label}{' '}
                    {component.weight > 0 && (
                      <span className="text-xs text-dt-text-muted/60">
                        ({(component.weight * 100).toFixed(0)}%)
                      </span>
                    )}
                  </span>
                  <span className="font-medium text-dt-text">
                    {component.normalizedValue.toFixed(1)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={cn('h-full rounded-full transition-all', getBarColor(component.normalizedValue))}
                    style={{ width: `${Math.min(component.normalizedValue, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Penalty Components */}
        {penaltyComponents.length > 0 && (
          <div className="space-y-3 border-t border-red-200 pt-4 dark:border-red-900/40">
            <p className="text-xs font-medium text-red-600 dark:text-red-400">Penalties</p>
            {penaltyComponents.map((component) => (
              <div key={component.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-600 dark:text-red-400">
                    {component.label}
                  </span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {component.weightedValue.toFixed(1)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-red-50 dark:bg-red-950/30">
                  <div
                    className="h-full rounded-full bg-red-500 transition-all"
                    style={{ width: `${Math.min(Math.abs(component.normalizedValue), 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dispute Win Rate bar (informational — matches freelancer visual) */}
        {infoBarComponents.length > 0 && (
          <div className="space-y-3 border-t border-dt-border pt-4">
            <p className="text-xs font-medium text-dt-text-muted">Dispute &amp; Compliance</p>
            {infoBarComponents.map((component) => (
              <div key={component.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-dt-text-muted">
                    {component.label}{' '}
                    <span className="text-xs text-dt-text-muted/60">(info)</span>
                  </span>
                  <span className="font-medium text-dt-text">
                    {component.normalizedValue.toFixed(1)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={cn('h-full rounded-full transition-all', getBarColor(component.normalizedValue))}
                    style={{ width: `${Math.min(component.normalizedValue, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Text-only info (cancellation status, etc.) */}
        {infoTextComponents.length > 0 && (
          <div className={cn(
            'space-y-3 pt-4',
            infoBarComponents.length === 0 && 'border-t border-dt-border',
          )}>
            {infoBarComponents.length === 0 && (
              <p className="text-xs font-medium text-dt-text-muted">Dispute &amp; Compliance</p>
            )}
            {infoTextComponents.map((component) => {
              const isDispute = component.label === 'Dispute Record';
              const displayValue = isDispute
                ? `${component.rawValue} dispute${component.rawValue !== 1 ? 's' : ''} · ${component.normalizedValue}% win rate`
                : component.rawValue === 0
                  ? 'Clean record'
                  : `${component.rawValue} cancelled`;

              return (
                <div key={component.label} className="flex items-center justify-between text-sm">
                  <span className="text-dt-text-muted">{component.label}</span>
                  <span className={cn(
                    'font-medium',
                    component.rawValue === 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400',
                  )}>
                    {displayValue}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
