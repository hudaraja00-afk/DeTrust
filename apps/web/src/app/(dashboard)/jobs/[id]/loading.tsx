import { PageHeaderSkeleton, CardSkeleton, Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-20" />
      <div className="grid gap-6 lg:grid-cols-[1fr,380px]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-dt-border bg-dt-surface p-6 shadow-md">
            <Skeleton className="mb-4 h-7 w-3/5" />
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="mb-2 h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
          <CardSkeleton />
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl border border-dt-border bg-dt-surface p-6 shadow-md">
            <Skeleton className="mb-4 h-5 w-2/5" />
            <Skeleton className="mb-3 h-4 w-full" />
            <Skeleton className="mb-3 h-4 w-3/5" />
            <Skeleton className="mb-3 h-4 w-4/5" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
