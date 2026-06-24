export type TrustLevel = 'high' | 'medium' | 'low' | 'danger';

export function getTrustLevel(score: number): TrustLevel {
  if (score >= 75) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

export function getTrustColor(score: number): string {
  const level = getTrustLevel(score);
  const colors: Record<TrustLevel, string> = {
    high: '#22c55e',
    medium: '#3b82f6',
    low: '#eab308',
    danger: '#ef4444',
  };
  return colors[level];
}

export function getTrustTailwindClass(score: number): string {
  const level = getTrustLevel(score);
  const classes: Record<TrustLevel, string> = {
    high: 'text-trust-high',
    medium: 'text-trust-medium',
    low: 'text-trust-low',
    danger: 'text-trust-danger',
  };
  return classes[level];
}

export function getTrustBgClass(score: number): string {
  const level = getTrustLevel(score);
  const classes: Record<TrustLevel, string> = {
    high: 'bg-trust-high',
    medium: 'bg-trust-medium',
    low: 'bg-trust-low',
    danger: 'bg-trust-danger',
  };
  return classes[level];
}

export function getTrustLabel(score: number): string {
  if (score >= 75) return 'Excellent';
  if (score >= 50) return 'Good';
  if (score >= 25) return 'Fair';
  return 'Needs Improvement';
}
