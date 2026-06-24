import { Skeleton, CardSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-10">
      {/* Hero skeleton */}
      <section className="rounded-[32px] border border-dt-border bg-dt-surface p-8 shadow-xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Skeleton className="h-24 w-24 rounded-3xl" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-4 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-36 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-32 w-32 rounded-full" />
        </div>
        {/* Highlight stats */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      </section>

      {/* Two-column cards */}
      <div className="grid gap-6 lg:grid-cols-[1.65fr,1fr]">
        <div className="space-y-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="space-y-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}
