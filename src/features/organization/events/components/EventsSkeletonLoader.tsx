import { Skeleton } from "@/components/ui/skeleton";
import { ViewMode } from "./ViewToggle";

interface EventsSkeletonLoaderProps {
  viewMode?: ViewMode;
}

export function EventsSkeletonLoader({ viewMode = "card" }: EventsSkeletonLoaderProps) {
  if (viewMode === "list") {
    return (
      <div className="space-y-3">
        {Array(5)
          .fill(0)
          .map((_, index) => (
            <div key={index} className="rounded-lg border shadow-sm bg-white dark:bg-gray-800">
              <div className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array(6)
        .fill(0)
        .map((_, index) => (
          <div key={index} className="rounded-lg border shadow-sm bg-white dark:bg-gray-800">
            <div className="p-4">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="flex-1 pt-1">
                    <Skeleton className="h-4 w-16 mb-1" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="flex-1 pt-1">
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="flex-1 pt-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
