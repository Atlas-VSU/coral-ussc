import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

interface AttendanceSkeletonLoaderProps {
  count?: number
}

function AttendanceItemSkeleton() {
  return (
    <Card className="overflow-hidden bg-muted/30 border-dashed">
      <CardContent className="p-0">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
          {/* Left Side: Avatar & Details */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
            
            {/* Student Info */}
            <div className="flex flex-col gap-1.5 min-w-0">
              {/* Name */}
              <Skeleton className="h-4 w-32 sm:w-40" />
              {/* ID */}
              <Skeleton className="h-3 w-20 sm:w-24" />
            </div>
          </div>

          {/* Right Side: Time & Status Badge */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Time (Hidden on mobile) */}
            <Skeleton className="hidden sm:block h-3 w-10" />
            {/* Badge */}
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function AttendanceSkeletonLoader({ count = 5 }: AttendanceSkeletonLoaderProps) {
  const items = Array.from({ length: count })

  return (
    <div className="space-y-2">
      {items.map((_, i) => (
        <AttendanceItemSkeleton key={i} />
      ))}
    </div>
  )
}