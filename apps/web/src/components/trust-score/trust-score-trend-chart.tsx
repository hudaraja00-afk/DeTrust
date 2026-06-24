'use client';

import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TRUST_SCORE_EXCELLENT, TRUST_SCORE_GOOD } from '@/lib/review-utils';
import type { TrustScoreHistoryEntry } from '@/lib/api/user';

interface TrustScoreTrendChartProps {
  history: TrustScoreHistoryEntry[];
  className?: string;
}

function getScoreColor(score: number): string {
  if (score > TRUST_SCORE_EXCELLENT) return '#22c55e';
  if (score >= TRUST_SCORE_GOOD) return '#3b82f6';
  if (score > 0) return '#eab308';
  return '#94a3b8';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length || !label) return null;

  const score = payload[0].value;
  return (
    <div className="rounded-lg border border-dt-border bg-dt-surface px-3 py-2 shadow-lg">
      <p className="text-xs text-dt-text-muted">{label}</p>
      <p className="text-sm font-semibold" style={{ color: getScoreColor(score) }}>
        {score.toFixed(1)}
      </p>
    </div>
  );
}

export function TrustScoreTrendChart({ history, className }: TrustScoreTrendChartProps) {
  const chartData = useMemo(
    () =>
      history.map((entry) => ({
        date: formatDate(entry.createdAt),
        score: Number(entry.score),
      })),
    [history],
  );

  const latestScore = chartData.length > 0 ? chartData[chartData.length - 1].score : 0;
  const firstScore = chartData.length > 0 ? chartData[0].score : 0;
  const trend = latestScore - firstScore;

  if (chartData.length < 2) {
    return null;
  }

  return (
    <Card className={cn('border-dt-border bg-dt-surface shadow-lg', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base text-dt-text">
          <span className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Trust Score Trend
          </span>
          {trend !== 0 && (
            <span
              className={cn(
                'text-sm font-medium',
                trend > 0 ? 'text-emerald-500' : 'text-red-500',
              )}
            >
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                className="fill-dt-text-muted"
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
                className="fill-dt-text-muted"
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="score"
                stroke={getScoreColor(latestScore)}
                strokeWidth={2}
                dot={{ r: 3, fill: getScoreColor(latestScore) }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
