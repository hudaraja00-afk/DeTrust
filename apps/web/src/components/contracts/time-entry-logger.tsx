'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Clock, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useTimeEntries, useCreateTimeEntry, useDeleteTimeEntry } from '@/hooks/queries/use-time-entries';
import type { TimeEntryResponse } from '@/lib/api/contract';

interface TimeEntryLoggerProps {
  contractId: string;
  milestoneId: string;
  isFreelancer: boolean;
  /** Whether the milestone can accept new entries (PENDING or IN_PROGRESS) */
  editable: boolean;
  /** Pre-loaded time entries from contract query (avoids extra fetch) */
  initialEntries?: TimeEntryResponse[];
}

export function TimeEntryLogger({
  contractId,
  milestoneId,
  isFreelancer,
  editable,
  initialEntries,
}: TimeEntryLoggerProps) {
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newHours, setNewHours] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useTimeEntries(contractId, milestoneId);
  const createMut = useCreateTimeEntry(contractId, milestoneId);
  const deleteMut = useDeleteTimeEntry(contractId, milestoneId);

  const entries = data?.entries ?? initialEntries ?? [];
  const totalHours = data?.totalHours ?? entries.reduce((sum, e) => sum + Number(e.hours), 0);

  const handleAdd = async () => {
    const hours = parseFloat(newHours);
    if (!newDate || isNaN(hours) || hours < 0.25 || hours > 24) {
      toast.error('Please enter a valid date and hours (0.25 - 24)');
      return;
    }
    if (!newDescription.trim()) {
      toast.error('Please enter a description of work done');
      return;
    }

    const res = await createMut.mutateAsync({ date: newDate, hours, description: newDescription.trim() });
    if (res.success) {
      toast.success('Time entry logged');
      setNewHours('');
      setNewDescription('');
      setShowForm(false);
    } else {
      toast.error(res.error?.message || 'Failed to log time');
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm('Delete this time entry?')) return;
    const res = await deleteMut.mutateAsync(entryId);
    if (res.success) {
      toast.success('Time entry deleted');
    } else {
      toast.error('Failed to delete time entry');
    }
  };

  return (
    <div className="space-y-3">
      {/* Header with total */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-dt-text">
          <Clock className="h-4 w-4" />
          <span>Time Log</span>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            {totalHours.toFixed(1)} hrs
          </span>
        </div>
        {isFreelancer && editable && !showForm && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="gap-1 border-dt-border text-xs">
            <Plus className="h-3 w-3" /> Log Hours
          </Button>
        )}
      </div>

      {/* Add entry form */}
      {showForm && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-dt-text-muted">Date</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full rounded border border-dt-border px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-dt-text-muted">Hours</label>
              <input
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                value={newHours}
                onChange={(e) => setNewHours(e.target.value)}
                placeholder="8.0"
                className="w-full rounded border border-dt-border px-2 py-1.5 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-dt-text-muted">Work Description</label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Describe the work done..."
              rows={2}
              className="w-full rounded border border-dt-border px-2 py-1.5 text-sm resize-none"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={createMut.isPending} className="bg-emerald-500 text-white hover:bg-emerald-600 text-xs">
              {createMut.isPending ? <Spinner size="sm" /> : 'Save Entry'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)} className="text-xs">Cancel</Button>
          </div>
        </div>
      )}

      {/* Entries list */}
      {isLoading ? (
        <div className="flex justify-center py-2"><Spinner size="sm" /></div>
      ) : entries.length === 0 ? (
        <p className="text-xs text-dt-text-muted italic">No hours logged yet</p>
      ) : (
        <div className="space-y-1">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-start gap-2 rounded border border-dt-border/50 bg-dt-surface-alt/30 px-2 py-1.5 text-sm">
              <div className="min-w-[70px] text-xs text-dt-text-muted">
                {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <div className="min-w-[40px] font-medium text-emerald-700 text-xs">
                {Number(entry.hours).toFixed(1)}h
              </div>
              <div className="flex-1 text-xs text-dt-text-muted truncate">
                {entry.description}
              </div>
              {isFreelancer && editable && (
                <button
                  onClick={() => handleDelete(entry.id)}
                  disabled={deleteMut.isPending}
                  className="text-red-400 hover:text-red-600 shrink-0"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
