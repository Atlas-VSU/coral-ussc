import { Skeleton } from "@/components/ui/skeleton";

export function AttendanceListSkeleton() {
  return (
    <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 dark:from-gray-800 dark:via-gray-800 dark:to-gray-700/50 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-lg shadow-blue-100/50 dark:shadow-gray-900/20">
      {/* Header Skeleton */}
      <div className="p-6 border-b border-gray-200/60 dark:border-gray-700/60">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>
        
        {/* Legend Skeleton */}
        <div className="mt-4 p-3 rounded-lg bg-gray-50/80 dark:bg-gray-800/40 border border-gray-200/60 dark:border-gray-700/60">
          <div className="flex flex-wrap items-center gap-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-36" />
          </div>
        </div>
      </div>

      {/* List Skeleton */}
      <div className="p-6">
        <div className="space-y-3">
          {Array(8)
            .fill(0)
            .map((_, i) => (
              <div 
                key={i} 
                className="p-4 rounded-lg border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/40"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Student Info Skeleton */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </div>
                    </div>
                  </div>

                  {/* Time Records Skeleton */}
                  <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
                    <Skeleton className="h-8 w-32 rounded-lg" />
                    <Skeleton className="h-8 w-32 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
