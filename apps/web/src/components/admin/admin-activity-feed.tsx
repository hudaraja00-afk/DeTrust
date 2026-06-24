'use client';

import {
  User,
  Briefcase,
  Shield,
  FileText,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import type { ActivityItem } from '@/lib/api/admin';

const activityIcons: Record<string, React.ReactNode> = {
  user: <User className="h-4 w-4" />,
  job: <Briefcase className="h-4 w-4" />,
  dispute: <Shield className="h-4 w-4" />,
  contract: <FileText className="h-4 w-4" />,
};

const activityColors: Record<string, string> = {
  user: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  job: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  dispute: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  contract: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface AdminActivityFeedProps {
  activity?: ActivityItem[];
  loading: boolean;
}

export function AdminActivityFeed({ activity, loading }: AdminActivityFeedProps) {
  return (
    <Card className="border-dt-border bg-dt-surface shadow-lg lg:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-dt-text">
          <Activity className="h-5 w-5 text-emerald-500" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[300px] items-center justify-center"><Spinner size="md" /></div>
        ) : activity && activity.length > 0 ? (
          <div className="space-y-2">
            {activity.map((item: ActivityItem, idx: number) => (
              <div
                key={`${item.type}-${item.id}-${idx}`}
                className="flex items-center gap-3 rounded-xl border border-dt-border p-3 transition hover:bg-dt-surface-alt"
              >
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', activityColors[item.type])}>
                  {activityIcons[item.type]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-dt-text">{item.title}</p>
                  <p className="text-xs text-dt-text-muted">
                    <span className="capitalize">{item.type}</span> · {item.status}
                  </p>
                </div>
                <span className="whitespace-nowrap text-xs text-dt-text-muted">{timeAgo(item.createdAt)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-sm text-dt-text-muted">
            No recent activity
          </div>
        )}
      </CardContent>
    </Card>
  );
}
