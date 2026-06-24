'use client';

import Link from 'next/link';
import { Clock3, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface ChecklistTask {
  label: string;
  complete: boolean;
}

export interface ProfileChecklistCardProps {
  taskList: ChecklistTask[];
  onRefetch: () => void;
  isFetching: boolean;
}

export function ProfileChecklistCard({ taskList, onRefetch, isFetching }: ProfileChecklistCardProps) {
  return (
    <Card className="border-dt-border bg-dt-surface shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base text-dt-text">
          Completion checklist
          <Button variant="ghost" size="sm" onClick={onRefetch} disabled={isFetching} className="text-xs text-dt-text-muted">
            <Clock3 className={`mr-2 h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} /> Sync
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {taskList.map((task) => (
          <div key={task.label} className="flex items-center justify-between rounded-2xl border border-dt-border bg-dt-surface-alt px-4 py-3">
            <div>
              <p className="text-sm font-medium text-dt-text">{task.label}</p>
              <p className="text-xs text-dt-text-muted">{task.complete ? 'Looks great' : 'Required'}</p>
            </div>
            {task.complete ? (
              <Shield className="h-5 w-5 text-dt-text" />
            ) : (
              <Clock3 className="h-5 w-5 text-dt-text-muted" />
            )}
          </div>
        ))}
        <p className="text-xs text-dt-text-muted">
          Ready to edit? <Link href="/profile/edit" className="font-semibold text-dt-text underline">Jump to the editor &rarr;</Link>
        </p>
      </CardContent>
    </Card>
  );
}
