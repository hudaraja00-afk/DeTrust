"use client";

import { cn } from '@/lib/utils';

interface ProfileProgressRingProps {
  value?: number;
  label?: string;
  caption?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ProfileProgressRing({
  value = 0,
  label = 'Complete',
  caption,
  size = 176,
  strokeWidth = 12,
  className,
}: ProfileProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (clamped / 100) * circumference;

  return (
    <div className={cn('relative inline-flex flex-col items-center text-dt-text-muted', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <defs>
            <linearGradient id="profileRing" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--brand-primary))" />
              <stop offset="50%" stopColor="hsl(var(--brand-iris))" />
              <stop offset="100%" stopColor="hsl(var(--brand-sun))" />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#profileRing)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="transparent"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={progressOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-semibold text-dt-text">{Math.round(clamped)}%</span>
          <span className="text-[0.65rem] uppercase tracking-[0.4em] text-slate-400">{label}</span>
        </div>
      </div>
      {caption ? <p className="mt-3 text-xs text-dt-text-muted">{caption}</p> : null}
    </div>
  );
}

export default ProfileProgressRing;
