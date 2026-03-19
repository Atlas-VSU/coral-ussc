import { Skeleton } from "@/components/ui/skeleton";

const card =
  "bg-gradient-to-br from-white via-green-50/30 to-emerald-50/20 dark:from-gray-800 dark:via-gray-800 dark:to-gray-700/50 rounded-xl dark:border-gray-700/60 shadow-lg shadow-green-100/50 dark:shadow-gray-900/20";
const innerRow =
  "p-4 rounded-lg dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/40";

export function EventSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-20" />
      </div>

      {/* Back Button Skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Event Details Skeleton */}
      <div className={`${card} p-6`}>
        <div className="flex items-start gap-3 mb-6">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-3 w-3 rounded-full" />
            </div>
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="pt-6 border-t border-green-200/60 dark:border-gray-700/60">
          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <Skeleton className="h-6 w-64 mb-1" />
                <Skeleton className="h-1 w-10 rounded-full" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className={innerRow}>
                <Skeleton className="h-4 w-32" />
              </div>
              <div className={innerRow}>
                <Skeleton className="h-4 w-28" />
              </div>
              <div className={innerRow}>
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendees Header Skeleton */}
      <div className={`${card} p-6`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div>
              <Skeleton className="h-6 w-40 mb-1" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32 rounded-lg" />
            <Skeleton className="h-10 w-20 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className={`${card} p-6`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-10 w-40 rounded-lg" />
            <Skeleton className="h-10 w-40 rounded-lg" />
            <Skeleton className="h-10 w-20 rounded-lg" />
          </div>
          <div className="flex gap-0">
            <Skeleton className="h-10 w-20 rounded-l-lg" />
            <Skeleton className="h-10 w-48 rounded-r-lg" />
          </div>
        </div>
      </div>

      {/* Attendance List Skeleton */}
      <div className={card}>
        <div className="p-6 border-b border-green-200/60 dark:border-gray-700/60">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div>
                <Skeleton className="h-6 w-40 mb-1" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <div key={i} className={innerRow}>
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-5 w-20 rounded-full" />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Skeleton className="h-8 w-32 rounded-lg" />
                      <Skeleton className="h-8 w-32 rounded-lg" />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
