import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Profile header */}
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
          </div>
          <Skeleton className="h-4 w-64 max-w-lg" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-10">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>

        {/* Grid */}
        <div className="mt-6 grid grid-cols-3 gap-1 md:gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
