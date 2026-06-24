import {
  Skeleton,
  StatCardSkeleton,
  CardSkeleton,
} from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Hero section skeleton */}
      <section className="rounded-[32px] border border-dt-border bg-dt-surface p-8 shadow-xl">
        <div className="grid gap-8 lg:grid-cols-[1.6fr,auto]">
          <div className="space-y-4">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-8 w-96" />
            <Skeleton className="h-5 w-full max-w-2xl" />
            <div className="grid gap-4 md:grid-cols-3">
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
          </div>
          <div className="flex flex-col items-center space-y-4">
            <Skeleton className="h-32 w-32 rounded-full" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </section>

      {/* Stat cards row */}
      <div className="grid gap-6 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Content cards row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
