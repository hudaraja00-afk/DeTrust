import {
  CardSkeleton,
  PageHeaderSkeleton,
  Skeleton,
} from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />

      {/* Search bar skeleton */}
      <div className="rounded-2xl border border-dt-border bg-dt-surface p-4 shadow-md">
        <div className="flex flex-wrap gap-4">
          <Skeleton className="h-10 flex-1 min-w-[200px] rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>

      {/* Job card skeletons */}
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
