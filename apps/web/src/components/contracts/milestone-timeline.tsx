'use client';

import { type ContractMilestone } from '@/lib/api/contract';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, { bg: string; ring: string; text: string }> = {
  PENDING: { bg: 'bg-slate-200', ring: 'ring-slate-300', text: 'text-slate-600' },
  IN_PROGRESS: { bg: 'bg-blue-500', ring: 'ring-blue-300', text: 'text-blue-700' },
  SUBMITTED: { bg: 'bg-blue-500', ring: 'ring-blue-300', text: 'text-blue-700' },
  APPROVED: { bg: 'bg-emerald-500', ring: 'ring-emerald-300', text: 'text-emerald-700' },
  PAID: { bg: 'bg-green-500', ring: 'ring-green-300', text: 'text-green-700' },
  DISPUTED: { bg: 'bg-red-500', ring: 'ring-red-300', text: 'text-red-700' },
  REVISION_REQUESTED: { bg: 'bg-amber-500', ring: 'ring-amber-300', text: 'text-amber-700' },
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  PAID: 'Paid',
  DISPUTED: 'Disputed',
  REVISION_REQUESTED: 'Revision',
};

interface MilestoneTimelineProps {
  milestones: ContractMilestone[];
}

export function MilestoneTimeline({ milestones }: MilestoneTimelineProps) {
  const sorted = [...milestones].sort((a, b) => a.orderIndex - b.orderIndex);
  const completedCount = sorted.filter((m) => m.status === 'PAID' || m.status === 'APPROVED').length;

  return (
    <div className="rounded-2xl border border-dt-border bg-dt-surface p-5 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-dt-text-muted">Milestone Progress</h3>
        <span className="text-sm text-dt-text-muted">{completedCount}/{sorted.length} completed</span>
      </div>

      {/* Desktop: horizontal */}
      <div className="hidden md:flex md:items-center md:gap-0">
        {sorted.map((milestone, idx) => {
          const colors = STATUS_COLORS[milestone.status] ?? STATUS_COLORS.PENDING;
          const isLast = idx === sorted.length - 1;

          return (
            <div key={milestone.id} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ring-2',
                    colors.bg,
                    colors.ring,
                  )}
                >
                  {idx + 1}
                </div>
                <p className="mt-1 max-w-[80px] truncate text-center text-[10px] font-medium text-dt-text-muted" title={milestone.title}>
                  {milestone.title}
                </p>
                <p className={cn('text-[10px] font-semibold', colors.text)}>
                  {STATUS_LABELS[milestone.status] ?? milestone.status}
                </p>
              </div>
              {!isLast && (
                <div className={cn(
                  'mx-1 h-0.5 flex-1',
                  (milestone.status === 'PAID' || milestone.status === 'APPROVED')
                    ? 'bg-emerald-400'
                    : 'bg-slate-200',
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical */}
      <div className="flex flex-col gap-0 md:hidden">
        {sorted.map((milestone, idx) => {
          const colors = STATUS_COLORS[milestone.status] ?? STATUS_COLORS.PENDING;
          const isLast = idx === sorted.length - 1;

          return (
            <div key={milestone.id} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ring-2',
                    colors.bg,
                    colors.ring,
                  )}
                >
                  {idx + 1}
                </div>
                {!isLast && (
                  <div className={cn(
                    'w-0.5 flex-1 min-h-[24px]',
                    (milestone.status === 'PAID' || milestone.status === 'APPROVED')
                      ? 'bg-emerald-400'
                      : 'bg-slate-200',
                  )} />
                )}
              </div>
              <div className="pb-4">
                <p className="text-sm font-medium text-dt-text">{milestone.title}</p>
                <p className={cn('text-xs font-semibold', colors.text)}>
                  {STATUS_LABELS[milestone.status] ?? milestone.status}
                </p>
                <p className="text-xs text-dt-text-muted">${Number(milestone.amount).toLocaleString()}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
