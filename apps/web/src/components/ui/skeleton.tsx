export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-dt-surface-alt ${className ?? ''}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-dt-border bg-dt-surface p-6 shadow-md">
      <Skeleton className="mb-4 h-5 w-2/5" />
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="mb-2 h-4 w-4/5" />
      <Skeleton className="h-4 w-3/5" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-dt-border bg-dt-surface p-4 shadow-sm">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-3 w-2/5" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-10 w-32 rounded-xl" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-dt-border bg-dt-surface p-6 shadow-md">
      <Skeleton className="mb-3 h-4 w-24" />
      <Skeleton className="mb-1 h-8 w-20" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}
