import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ViewMode } from "./ViewToggle";

interface MembersSkeletonProps {
  viewMode?: ViewMode;
}

export function MembersSkeleton({ viewMode = "card" }: MembersSkeletonProps) {
  if (viewMode === "table") {
    return (
      <div className="space-y-6">
        {/* Premium header skeleton */}
        {/* <div className="bg-gradient-to-br from-gray-100 via-blue-100 to-indigo-100 dark:from-gray-800 dark:via-blue-900/30 dark:to-indigo-900/30 rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
          <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
            <div className="space-y-3">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-5 w-80" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Skeleton className="h-11 w-32" />
              <Skeleton className="h-11 w-32" />
              <Skeleton className="h-11 w-32" />
            </div>
          </div>
        </div> */}

        {/* Premium search and filter skeleton */}
        {/* <div className="bg-gradient-to-r from-gray-100/80 via-blue-100/80 to-indigo-100/80 dark:from-gray-800/50 dark:via-blue-900/30 dark:to-indigo-900/30 rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg space-y-5">
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-11 w-full" />
          </div>
          <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
            <div className="flex flex-wrap gap-3">
              <Skeleton className="h-11 w-44" />
              <Skeleton className="h-11 w-32" />
            </div>
            <Skeleton className="h-11 w-44" />
          </div>
        </div> */}

        <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm overflow-hidden">
          {/* Mobile View - Card-like layout for small screens */}
          <div className="block sm:hidden">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="space-y-3">
                    {/* Name and Student ID */}
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <div className="flex items-center gap-1">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </div>

                    {/* Program and Faculty */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <div className="flex justify-between text-xs">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tablet and Desktop View - Traditional table layout */}
          <div className="hidden sm:block">
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {/* Table Header */}
                <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <div className="grid grid-cols-12 gap-0">
                    <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 col-span-2">
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 col-span-2">
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 col-span-3 hidden md:grid">
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 col-span-3 hidden lg:grid">
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 col-span-2">
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 col-span-1 text-right">
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                </div>

                {/* Table Body */}
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${i % 2 === 0 ? "bg-gray-25 dark:bg-gray-900/50" : ""}`}>
                    <div className="grid grid-cols-12 gap-0 items-center">
                      <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 col-span-2">
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 col-span-2">
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 col-span-3 hidden md:flex">
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 col-span-3 hidden lg:flex">
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 col-span-2">
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 col-span-1 text-right">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          <Skeleton className="h-7 w-7 sm:h-8 sm:w-8" />
                          <Skeleton className="h-7 w-7 sm:h-8 sm:w-8" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Card view (original implementation)
  // Create an array of 9 items for the grid
  const items = Array.from({ length: 9 }, (_, i) => i);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Members Grid - Exact match to MembersList layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card key={item} className="group hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden h-full flex flex-col hover:border-gray-300 dark:hover:border-gray-600">
              <CardContent className="p-0 flex flex-col flex-grow">
                {/* Member Header - Exact structure from MemberCard */}
                <div className="p-5 space-y-4">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-12 w-12 rounded-full border border-gray-200 dark:border-gray-700" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Skeleton className="h-5 w-20 rounded-full" />
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Divider - Exact match */}
                  <div className="border-t border-gray-200 dark:border-gray-700"></div>

                  {/* Member Details - Exact structure with 3 sections */}
                  <div className="space-y-3">
                    {/* Email Section */}
                    <div className="flex items-start gap-3">
                      <Skeleton className="w-7 h-7 rounded-md" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>

                    {/* Faculty Section */}
                    <div className="flex items-start gap-3">
                      <Skeleton className="w-7 h-7 rounded-md" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    </div>

                    {/* Student ID Section */}
                    <div className="flex items-start gap-3">
                      <Skeleton className="w-7 h-7 rounded-md" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Spacer - Exact match */}
                <div className="flex-grow min-h-[10px]"></div>

                {/* Action Buttons - Exact match */}
                <div className="flex border-t border-gray-200 dark:border-gray-700 mt-auto bg-gray-50/50 dark:bg-gray-800/50">
                  <Skeleton className="h-11 w-1/2 rounded-none" />
                  <div className="border-r border-gray-200 dark:border-gray-700 h-11" />
                  <Skeleton className="h-11 w-1/2 rounded-none" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Premium pagination skeleton */}
        <div className="flex justify-center mt-8">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-2">
            <div className="flex items-center gap-1">
              <Skeleton className="h-10 w-10 rounded" />
              <Skeleton className="h-10 w-10 rounded" />
              <Skeleton className="h-10 w-10 rounded" />
              <Skeleton className="h-10 w-10 rounded" />
              <Skeleton className="h-10 w-10 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
