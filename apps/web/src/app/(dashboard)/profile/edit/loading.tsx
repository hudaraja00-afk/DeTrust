import { PageHeaderSkeleton, Skeleton } from '@/components/ui/skeleton';

function FormSectionSkeleton() {
  return (
    <div className="rounded-2xl border border-dt-border bg-dt-surface p-6 shadow-md space-y-5">
      <Skeleton className="h-6 w-40" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Hero banner skeleton */}
      <section className="rounded-[36px] border border-dt-border bg-dt-surface p-8 shadow-xl">
        <div className="grid gap-8 lg:grid-cols-[1.2fr,auto]">
          <div className="space-y-4">
            <Skeleton className="h-3 w-48" />
            <div className="flex items-center gap-5">
              <Skeleton className="h-24 w-24 rounded-3xl" />
              <div className="space-y-3 flex-1">
                <Skeleton className="h-8 w-96" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
            <Skeleton className="h-4 w-full max-w-xl" />
            <div className="flex gap-3">
              <Skeleton className="h-6 w-36 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-40 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-32 w-32 rounded-full" />
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </section>

      <PageHeaderSkeleton />

      {/* Form sections */}
      <div className="grid gap-6 lg:grid-cols-[1.8fr,1fr]">
        <div className="space-y-6">
          <FormSectionSkeleton />
          <FormSectionSkeleton />
          <FormSectionSkeleton />
        </div>
        <div className="space-y-6">
          {/* Checklist skeleton */}
          <div className="rounded-2xl border border-dt-border bg-dt-surface p-6 shadow-md space-y-4">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
          {/* Identity card skeleton */}
          <div className="rounded-2xl border border-dt-border bg-dt-surface p-6 shadow-md space-y-4">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
