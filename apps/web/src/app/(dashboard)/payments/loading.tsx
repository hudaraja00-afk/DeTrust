import {
  Skeleton,
  StatCardSkeleton,
  TableRowSkeleton,
} from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Stat cards row (wallet + 3 stats) */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Wallet balance card (taller) */}
        <div className="rounded-2xl border border-dt-border bg-dt-surface p-6 shadow-md">
          <Skeleton className="mb-2 h-4 w-28" />
          <Skeleton className="mb-1 h-9 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Transaction rows */}
      <div className="space-y-4">
        <TableRowSkeleton />
        <TableRowSkeleton />
        <TableRowSkeleton />
        <TableRowSkeleton />
        <TableRowSkeleton />
      </div>
    </div>
  );
}
