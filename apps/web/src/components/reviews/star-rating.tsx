'use client';

import { useCallback } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  showValue?: boolean;
  className?: string;
}

const SIZES = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function StarRating({
  value,
  onChange,
  max = 5,
  size = 'md',
  readonly = false,
  showValue = false,
  className,
}: StarRatingProps) {
  const handleClick = useCallback(
    (star: number) => {
      if (!readonly && onChange) {
        onChange(star);
      }
    },
    [readonly, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, star: number) => {
      if (!readonly && onChange && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onChange(star);
      }
    },
    [readonly, onChange]
  );

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: max }, (_, i) => {
        const star = i + 1;
        const filled = star <= value;

        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => handleClick(star)}
            onKeyDown={(e) => handleKeyDown(e, star)}
            tabIndex={readonly ? -1 : 0}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
            className={cn(
              'transition-colors focus:outline-none',
              !readonly && 'cursor-pointer hover:scale-110 focus-visible:ring-2 focus-visible:ring-emerald-500 rounded',
              readonly && 'cursor-default'
            )}
          >
            <Star
              className={cn(
                SIZES[size],
                'transition-colors',
                filled
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-transparent text-slate-300 dark:text-slate-600'
              )}
            />
          </button>
        );
      })}
      {showValue && (
        <span className="ml-1.5 text-sm font-medium text-dt-text-muted">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}
