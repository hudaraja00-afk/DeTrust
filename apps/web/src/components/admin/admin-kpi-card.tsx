'use client';

import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  href?: string;
  color?: string;
}

const colorMap: Record<string, string> = {
  emerald: 'from-emerald-500 to-emerald-600',
  blue: 'from-blue-500 to-blue-600',
  violet: 'from-violet-500 to-violet-600',
  amber: 'from-amber-500 to-amber-600',
  rose: 'from-rose-500 to-rose-600',
  cyan: 'from-cyan-500 to-cyan-600',
};

export function KpiCard({ title, value, subtitle, icon, trend, trendLabel, href, color = 'emerald' }: KpiCardProps) {
  const content = (
    <Card className="group relative overflow-hidden border-dt-border bg-dt-surface transition-all hover:shadow-lg dark:hover:shadow-slate-900/50">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-dt-text-muted">{title}</p>
            <p className="mt-2 text-2xl font-bold text-dt-text">{typeof value === 'number' ? value.toLocaleString() : value}</p>
            {subtitle && <p className="mt-0.5 text-xs text-dt-text-muted">{subtitle}</p>}
            {trend !== undefined && (
              <div className="mt-2 flex items-center gap-1">
                {trend >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
                )}
                <span className={cn('text-xs font-medium', trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                  {trend > 0 ? '+' : ''}{trend}%
                </span>
                {trendLabel && <span className="text-xs text-dt-text-muted">{trendLabel}</span>}
              </div>
            )}
          </div>
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg', colorMap[color])}>
            {icon}
          </div>
        </div>
        {href && (
          <div className="mt-3 flex items-center gap-1 text-xs font-medium text-emerald-600 opacity-0 transition group-hover:opacity-100 dark:text-emerald-400">
            View details <ArrowUpRight className="h-3 w-3" />
          </div>
        )}
      </CardContent>
    </Card>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
