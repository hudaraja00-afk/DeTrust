import { PageHeaderSkeleton, Skeleton } from '@/components/ui/skeleton';

function ProfileCardSkeleton() {
  return (
    <div className="rounded-2xl border border-dt-border bg-dt-surface p-6 shadow-md">
      <div className="flex items-start gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-dt-surface-alt p-3">
        <Skeleton className="mx-auto h-8 w-12" />
        <Skeleton className="mx-auto h-8 w-12" />
        <Skeleton className="mx-auto h-8 w-12" />
      </div>
      <div className="mt-4 flex gap-1">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />

      {/* Search bar skeleton */}
      <div className="rounded-2xl border border-dt-border bg-dt-surface p-4 shadow-md">
        <div className="flex flex-wrap gap-4">
          <Skeleton className="h-10 flex-1 min-w-[200px] rounded-lg" />
          <Skeleton className="h-10 w-36 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>

      {/* Profile card grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <ProfileCardSkeleton />
        <ProfileCardSkeleton />
        <ProfileCardSkeleton />
        <ProfileCardSkeleton />
        <ProfileCardSkeleton />
        <ProfileCardSkeleton />
      </div>
    </div>
  );
}
