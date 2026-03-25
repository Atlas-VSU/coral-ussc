"use client"

import { Eye, MinusCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

import { CardGridSkeleton } from "@/components/organization/Skeletons"
import { ClearanceStatus } from "../../clearance/types"

interface UnpaidCardViewProps {
  paginatedUnpaid: ClearanceStatus[]
  onOpenDetail: (r: ClearanceStatus) => void
  isLoading?: boolean
}

export function UnpaidCardView({ paginatedUnpaid, onOpenDetail, isLoading }: UnpaidCardViewProps) {
  if (isLoading) {
    return <CardGridSkeleton count={6} />
  } else if (paginatedUnpaid.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">No unpaid records found</p>
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {paginatedUnpaid.map(record => {
        let totalDue = 0
        let totalDuesNumber = 0
        for (const [key, value] of Object.entries(record.blockingItems)) {
          if (value.status === "unpaid") {
            totalDue += value.balance;
            totalDuesNumber += 1;
          }
         }
        return (
          <Card key={record.studentId} className="border-border bg-card flex flex-col hover:shadow-md transition-shadow">
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2 max-[420px]:flex-col max-[420px]:items-start">
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-foreground truncate">{record.userName}</p>
                  <p className="text-xs text-muted-foreground">{record.studentId}</p>
                </div>
                <Badge variant="outline" className="flex items-center gap-1 text-xs shrink-0 whitespace-nowrap max-[420px]:self-start">
                  <span className="flex items-center gap-1"><MinusCircle className="size-3" />Unpaid</span>
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2.5">
                <p className="text-xs text-muted-foreground">Total Outstanding</p>
                <p className="text-lg font-semibold text-foreground">₱{totalDue.toLocaleString()}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground"># Dues</p>
                  <p className="font-medium">{totalDuesNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium text-foreground">Unsettled</p>
                </div>
              </div>
              <div className="pt-1 pb-1">
                <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs" onClick={() => onOpenDetail(record)}>
                  <Eye className="size-3.5" /> View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
