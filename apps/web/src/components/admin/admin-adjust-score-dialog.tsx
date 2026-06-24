'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAdjustTrustScore } from '@/hooks/queries/use-admin';
import { cn } from '@/lib/utils';

interface AdminAdjustScoreDialogProps {
  userId: string;
  userName: string;
  currentScore: number;
  onClose: () => void;
}

export function AdminAdjustScoreDialog({
  userId,
  userName,
  currentScore,
  onClose,
}: AdminAdjustScoreDialogProps) {
  const [adjustment, setAdjustment] = useState(0);
  const [reason, setReason] = useState('');
  const { mutate, isPending } = useAdjustTrustScore();

  const previewScore = Math.max(0, Math.min(100, currentScore + adjustment));
  const canSubmit = reason.length >= 10 && adjustment !== 0 && !isPending;

  function handleSubmit() {
    if (!canSubmit) return;
    mutate(
      { userId, payload: { adjustment, reason } },
      {
        onSuccess: () => onClose(),
      },
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md border-dt-border bg-dt-surface shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-dt-text">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Adjust Trust Score
          </CardTitle>
          <button onClick={onClose} className="text-dt-text-muted hover:text-dt-text">
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-dt-text-muted">
            Manual adjustment for <span className="font-medium text-dt-text">{userName}</span>
          </p>

          {/* Preview */}
          <div className="flex items-center justify-center gap-4 rounded-lg bg-dt-surface-secondary p-4">
            <div className="text-center">
              <p className="text-xs text-dt-text-muted">Current</p>
              <p className="text-xl font-bold text-dt-text">{currentScore.toFixed(1)}</p>
            </div>
            <span className="text-lg text-dt-text-muted">→</span>
            <div className="text-center">
              <p className="text-xs text-dt-text-muted">New</p>
              <p className={cn(
                'text-xl font-bold',
                previewScore > currentScore ? 'text-emerald-500' : previewScore < currentScore ? 'text-red-500' : 'text-dt-text',
              )}>
                {previewScore.toFixed(1)}
              </p>
            </div>
          </div>

          {/* Adjustment slider */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-dt-text">
              Adjustment ({adjustment > 0 ? '+' : ''}{adjustment})
            </label>
            <input
              type="range"
              min={-100}
              max={100}
              value={adjustment}
              onChange={(e) => setAdjustment(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-xs text-dt-text-muted">
              <span>-100</span>
              <span>0</span>
              <span>+100</span>
            </div>
            <Input
              type="number"
              min={-100}
              max={100}
              value={adjustment}
              onChange={(e) => setAdjustment(Math.max(-100, Math.min(100, Number(e.target.value))))}
              className="w-full text-center"
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-dt-text">
              Reason <span className="text-red-500">*</span>
              <span className="ml-1 text-xs text-dt-text-muted">(min 10 characters)</span>
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this adjustment is necessary…"
              rows={3}
              className="resize-none"
            />
            {reason.length > 0 && reason.length < 10 && (
              <p className="text-xs text-red-500">{10 - reason.length} more character(s) needed</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              {isPending ? 'Adjusting…' : 'Confirm Adjustment'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
