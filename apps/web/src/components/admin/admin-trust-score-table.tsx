'use client';

import { Shield, ShieldOff, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { AdminAdjustScoreDialog } from './admin-adjust-score-dialog';
import type { AdminTrustScoreEntry } from '@/lib/api/admin';

interface AdminTrustScoreTableProps {
  entries: AdminTrustScoreEntry[];
  isLoading: boolean;
}

function getScoreBadgeClass(score: number, eligible: boolean): string {
  if (!eligible) return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  if (score >= 75) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400';
  if (score >= 50) return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400';
  if (score > 0) return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
}

export function AdminTrustScoreTable({ entries, isLoading }: AdminTrustScoreTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adjustUserId, setAdjustUserId] = useState<string | null>(null);
  const [adjustUserName, setAdjustUserName] = useState<string>('');
  const [adjustCurrentScore, setAdjustCurrentScore] = useState<number>(0);

  if (isLoading) {
    return <div className="flex min-h-[200px] items-center justify-center"><Spinner size="lg" /></div>;
  }

  if (entries.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-sm text-dt-text-muted">
        No trust scores found matching your filters.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-dt-border">
        <table className="w-full text-sm">
          <thead className="bg-dt-surface-secondary">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-dt-text-muted">User</th>
              <th className="px-4 py-3 text-left font-medium text-dt-text-muted">Role</th>
              <th className="px-4 py-3 text-left font-medium text-dt-text-muted">Trust Score</th>
              <th className="px-4 py-3 text-left font-medium text-dt-text-muted">Eligible</th>
              <th className="px-4 py-3 text-left font-medium text-dt-text-muted">Contracts</th>
              <th className="px-4 py-3 text-left font-medium text-dt-text-muted">Last Updated</th>
              <th className="px-4 py-3 text-left font-medium text-dt-text-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dt-border">
            {entries.map((entry) => (
              <tr
                key={entry.userId}
                className="cursor-pointer hover:bg-dt-surface-secondary/50 transition-colors"
                onClick={() => setExpandedId(expandedId === entry.userId ? null : entry.userId)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {entry.avatarUrl ? (
                      <img src={entry.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-dt-surface-secondary text-xs font-medium text-dt-text-muted">
                        {(entry.name ?? '?')[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-dt-text">{entry.name ?? 'Unknown'}</p>
                      <p className="text-xs text-dt-text-muted">{entry.email ?? ''}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-xs">
                    {entry.role}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', getScoreBadgeClass(entry.trustScore, entry.eligible))}>
                    {entry.eligible ? (
                      <><Shield className="mr-1 h-3 w-3" />{entry.trustScore.toFixed(1)}</>
                    ) : (
                      <><ShieldOff className="mr-1 h-3 w-3" />N/A</>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {entry.eligible ? (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">Yes</span>
                  ) : (
                    <span className="text-xs text-dt-text-muted">No</span>
                  )}
                </td>
                <td className="px-4 py-3 text-dt-text">{entry.completedContracts}</td>
                <td className="px-4 py-3 text-xs text-dt-text-muted">
                  {new Date(entry.lastUpdated).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAdjustUserId(entry.userId);
                        setAdjustUserName(entry.name ?? 'Unknown');
                        setAdjustCurrentScore(entry.trustScore);
                      }}
                    >
                      Adjust
                    </button>
                    {expandedId === entry.userId ? (
                      <ChevronUp className="h-4 w-4 text-dt-text-muted" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-dt-text-muted" />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Adjust score dialog */}
      {adjustUserId && (
        <AdminAdjustScoreDialog
          userId={adjustUserId}
          userName={adjustUserName}
          currentScore={adjustCurrentScore}
          onClose={() => setAdjustUserId(null)}
        />
      )}
    </>
  );
}
