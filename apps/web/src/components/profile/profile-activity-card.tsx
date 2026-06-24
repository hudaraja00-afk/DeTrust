'use client';

import { PenLine } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface ActivityCard {
  label: string;
  body: string;
}

export interface ProfileActivityCardProps {
  activityCards: ActivityCard[];
}

export function ProfileActivityCard({ activityCards }: ProfileActivityCardProps) {
  return (
    <Card className="border-dt-border bg-dt-surface shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-dt-text">
          <PenLine className="h-4 w-4 text-dt-text-muted" /> Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-dt-text-muted">
        {activityCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-dt-border bg-dt-surface-alt p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-dt-text-muted">{card.label}</p>
            <p className="text-dt-text">{card.body}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
