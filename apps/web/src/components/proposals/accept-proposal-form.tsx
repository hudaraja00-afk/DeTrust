'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MilestoneFormItem {
  title: string;
  description: string;
  amount: number;
  dueDate: string;
}

export interface AcceptProposalFormProps {
  /** Whether the confirm action is currently in flight */
  isLoading: boolean;
  /** Job type: FIXED_PRICE or HOURLY */
  jobType?: string;
  /** Freelancer's proposed hourly rate (for hourly jobs) */
  proposedRate?: number;
  onConfirm: (milestones: MilestoneFormItem[]) => void;
  onConfirmHourly?: (weeklyHourLimit: number, durationWeeks: number) => void;
  onCancel: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AcceptProposalForm({
  isLoading,
  jobType,
  proposedRate,
  onConfirm,
  onConfirmHourly,
  onCancel,
}: AcceptProposalFormProps) {
  const isHourly = jobType === 'HOURLY';
  // Prisma Decimal values arrive as strings — normalise once
  const rate = proposedRate != null ? Number(proposedRate) : 0;

  // Per-proposal milestone state (fixed-price only)
  const [milestones, setMilestones] = useState<MilestoneFormItem[]>([
    { title: 'Project Completion', description: '', amount: rate, dueDate: '' },
  ]);

  // Hourly-specific state
  const [weeklyHourLimit, setWeeklyHourLimit] = useState(40);
  const [durationWeeks, setDurationWeeks] = useState(4);

  const hourlyPreview = useMemo(() => {
    if (!isHourly || !rate) return null;
    const weeklyAmount = rate * weeklyHourLimit;
    const totalAmount = weeklyAmount * durationWeeks;
    return { weeklyAmount, totalAmount };
  }, [isHourly, rate, weeklyHourLimit, durationWeeks]);

  // Fixed-price milestone handlers
  const updateMilestone = (
    index: number,
    field: keyof MilestoneFormItem,
    value: string | number,
  ) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  const addMilestone = () => {
    setMilestones([
      ...milestones,
      { title: '', description: '', amount: 0, dueDate: '' },
    ]);
  };

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  if (isHourly) {
    return (
      <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <h4 className="mb-4 font-semibold text-emerald-900">
          Create Hourly Contract
        </h4>

        <div className="space-y-4">
          {/* Rate display */}
          <div className="rounded-lg border border-emerald-100 bg-dt-surface p-3">
            <div className="text-sm text-dt-text-muted">Agreed Hourly Rate</div>
            <div className="text-lg font-semibold text-emerald-700">
              ${rate.toFixed(2)}/hr
            </div>
          </div>

          {/* Weekly hours */}
          <div>
            <label className="mb-1 block text-sm font-medium text-dt-text-muted">
              Weekly Hour Limit
            </label>
            <input
              type="number"
              min={1}
              max={80}
              value={weeklyHourLimit}
              onChange={(e) => setWeeklyHourLimit(Math.max(1, Math.min(80, Number(e.target.value))))}
              className="w-full rounded-lg border border-dt-border px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-dt-text-muted">
              Maximum hours per week (1-80)
            </p>
          </div>

          {/* Duration weeks */}
          <div>
            <label className="mb-1 block text-sm font-medium text-dt-text-muted">
              Contract Duration (weeks)
            </label>
            <input
              type="number"
              min={1}
              max={52}
              value={durationWeeks}
              onChange={(e) => setDurationWeeks(Math.max(1, Math.min(52, Number(e.target.value))))}
              className="w-full rounded-lg border border-dt-border px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-dt-text-muted">
              Number of weekly billing periods (1-52)
            </p>
          </div>

          {/* Preview */}
          {hourlyPreview && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-sm">
              <div className="mb-2 font-medium text-emerald-900">
                Contract Preview
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-dt-text-muted">
                  <span>Weekly cap ({weeklyHourLimit}hrs x ${rate.toFixed(2)})</span>
                  <span>${hourlyPreview.weeklyAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-dt-text-muted">
                  <span>Billing periods</span>
                  <span>{durationWeeks} weeks</span>
                </div>
                <div className="flex justify-between border-t border-emerald-200 pt-1 font-medium text-emerald-800">
                  <span>Total escrow</span>
                  <span>${hourlyPreview.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-dt-text-muted">
                  <span>Platform fee (3%)</span>
                  <span>${(hourlyPreview.totalAmount * 0.03).toFixed(2)}</span>
                </div>
              </div>
              <div className="mt-2 text-xs text-dt-text-muted">
                {durationWeeks} weekly milestones will be auto-generated. Freelancer logs hours each week.
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onCancel}
              className="border-dt-border"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => onConfirmHourly?.(weeklyHourLimit, durationWeeks)}
              disabled={isLoading}
              className="bg-emerald-500 text-white hover:bg-emerald-600"
            >
              {isLoading ? <Spinner size="sm" /> : 'Confirm & Create Hourly Contract'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Fixed-price form (existing behavior)
  return (
    <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <h4 className="mb-4 font-semibold text-emerald-900">
        Create Contract with Milestones
      </h4>

      <div className="space-y-4">
        {milestones.map((milestone, index) => (
          <div
            key={index}
            className="grid gap-3 rounded-lg border border-emerald-100 bg-dt-surface p-3 md:grid-cols-4"
          >
            <input
              type="text"
              value={milestone.title}
              onChange={(e) => updateMilestone(index, 'title', e.target.value)}
              placeholder="Milestone title"
              className="rounded-lg border border-dt-border px-3 py-2 text-sm"
            />
            <input
              type="number"
              value={milestone.amount || ''}
              onChange={(e) =>
                updateMilestone(index, 'amount', Number(e.target.value))
              }
              placeholder="Amount ($)"
              className="rounded-lg border border-dt-border px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={milestone.dueDate}
              onChange={(e) =>
                updateMilestone(index, 'dueDate', e.target.value)
              }
              className="rounded-lg border border-dt-border px-3 py-2 text-sm"
            />
            {milestones.length > 1 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeMilestone(index)}
                className="text-red-500"
              >
                Remove
              </Button>
            )}
          </div>
        ))}

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={addMilestone}
            className="border-emerald-200"
          >
            Add Milestone
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onCancel}
            className="border-dt-border"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => onConfirm(milestones)}
            disabled={isLoading}
            className="bg-emerald-500 text-white hover:bg-emerald-600"
          >
            {isLoading ? <Spinner size="sm" /> : 'Confirm & Create Contract'}
          </Button>
        </div>
      </div>
    </div>
  );
}
