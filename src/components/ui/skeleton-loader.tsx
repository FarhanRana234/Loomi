import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonCard() {
  return (
    <div className="w-full space-y-3 rounded-xl border border-border bg-card p-4">
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <Skeleton className="h-24 w-24 shrink-0 rounded-full sm:h-32 sm:w-32" />
        <div className="flex-1 space-y-4 text-center sm:text-left">
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
          <div className="flex justify-center gap-4 sm:justify-start">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-4 w-64 max-w-lg" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="mt-10">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
        <div className="mt-6 grid grid-cols-3 gap-1 md:gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
      <div className="mt-8 rounded-xl border border-border bg-card">
        <div className="p-6">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="space-y-3 px-6 pb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-border p-3">
              <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonMoodboards() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <div className="mt-8 flex gap-2">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>
      <div className="mt-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Skeleton className="h-4 w-4 shrink-0" />
              <Skeleton className="h-4 w-32 flex-1" />
              <Skeleton className="h-5 w-16 rounded-full shrink-0" />
            </div>
            <div className="grid grid-cols-3 gap-2 p-4 sm:grid-cols-4 md:grid-cols-6">
              {Array.from({ length: 6 }).map((_, j) => (
                <Skeleton key={j} className="aspect-square rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
