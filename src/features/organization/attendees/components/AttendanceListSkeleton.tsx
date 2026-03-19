import { Skeleton } from "@/components/ui/skeleton";

export function AttendanceListSkeleton() {
  return (
    <div
      className="rounded-xl border"
      style={{
        background:
          "linear-gradient(135deg, #ffffff 10%, #EAF3DE 100%, #C0DD97 100%)",
        borderColor: "#97C459",
        boxShadow: "0 4px 24px 0 rgba(5,140,17,0.08)",
      }}
    >
      {/* Header Skeleton */}
      <div className="p-6 border-b" style={{ borderColor: "#C0DD97" }}>
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
        <div
          className="mt-4 p-3 rounded-lg border"
          style={{ background: "#ffffff", borderColor: "#C0DD97" }}
        >
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
                className="p-4 rounded-lg border"
                style={{ background: "#ffffff", borderColor: "#C0DD97" }}
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
