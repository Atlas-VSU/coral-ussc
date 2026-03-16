import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { ViewMode } from "./ViewToggle"

interface EventsSkeletonLoaderProps {
  viewMode: ViewMode
  count?: number
}

function CardSkeleton() {
  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <CardHeader className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex gap-1.5 mb-3">
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-5 w-3/4 mb-2" />
            <div className="flex items-center gap-1.5 mt-2">
              <Skeleton className="h-3.5 w-3.5 rounded-sm" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded-md shrink-0" />
        </div>
      </CardHeader>

      <div className="mx-5 border-t border-border" />

      <CardContent className="px-5 py-4 flex-1 flex flex-col gap-4">
        {/* Location */}
        <div className="flex items-start gap-3">
          <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-3 w-16 mb-1.5" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>

        {/* Schedule */}
        <div className="flex items-start gap-3">
          <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-3 w-16 mb-1.5" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>

        {/* Attendees */}
        <div className="flex items-start gap-3">
          <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-3 w-20 mb-1.5" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ListItemSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center gap-4 px-5 py-4">
          <Skeleton className="w-1 self-stretch rounded-full shrink-0 min-h-14" />
          <div className="flex-1 min-w-0 grid sm:grid-cols-[1fr_auto] gap-3 sm:gap-6 items-center">
            <div>
              <div className="flex gap-2 mb-1">
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-1/2 mb-2" />
              <div className="flex gap-4 mt-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-28" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <Skeleton className="h-4 w-8 mb-1 ml-auto" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function EventsSkeletonLoader({ viewMode, count = 6 }: EventsSkeletonLoaderProps) {
  const items = Array.from({ length: count })

  if (viewMode === "card") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </div>
  )
}