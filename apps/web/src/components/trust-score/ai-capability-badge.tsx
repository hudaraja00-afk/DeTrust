"use client";

import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type CapabilityLevel = 'Beginner' | 'Intermediate' | 'Expert';

interface AiCapabilityBadgeProps {
  score: number;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function scoreToLevel(score: number): CapabilityLevel {
  if (score >= 66) return 'Expert';
  if (score >= 33) return 'Intermediate';
  return 'Beginner';
}

const LEVEL_CONFIG: Record<
  CapabilityLevel,
  { label: string; className: string; dot: string }
> = {
  Expert: {
    label: 'Expert',
    className: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-400',
  },
  Intermediate: {
    label: 'Intermediate',
    className: 'border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300',
    dot: 'bg-cyan-400',
  },
  Beginner: {
    label: 'Beginner',
    className: 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-400',
  },
};

const SIZE_CLASS = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-1',
  lg: 'text-sm px-3 py-1.5',
} as const;

export function AiCapabilityBadge({
  score,
  showScore = true,
  size = 'md',
  className = '',
}: AiCapabilityBadgeProps) {
  const level = scoreToLevel(score);
  const config = LEVEL_CONFIG[level];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${config.className} ${SIZE_CLASS[size]} ${className}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
            <Sparkles className="h-3 w-3" />
            {config.label}
            {showScore ? <span className="opacity-70">· {score}</span> : null}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px] text-center text-xs">
          <p className="font-semibold">AI Capability Score: {score}/100</p>
          <p className="mt-0.5 text-muted-foreground">
            Predicted by DeTrust&apos;s ML model using your skills, experience, and
            contract history. Updates on every profile change.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default AiCapabilityBadge;
