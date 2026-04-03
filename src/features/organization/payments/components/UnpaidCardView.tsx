"use client"

import { Eye, MinusCircle, FileText, DollarSign } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardGridSkeleton } from "@/components/organization/skeleton/CardGridSkeleton"
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
          <>
            {/* Mobile Layout (< md) */}
            <Card 
              key={`mobile-${record.studentId}`}
              className="md:hidden group hover:shadow-md active:shadow-sm transition-all duration-200 border-border bg-card overflow-hidden"
            >
              <CardContent className="p-0">
                <div className="w-full p-3 flex items-center gap-3 text-left active:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm text-foreground truncate">
                        {record.userName}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className="flex items-center gap-1 text-xs px-1.5 py-0.5">
                        <MinusCircle className="h-3 w-3" />Unpaid
                      </Badge>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{record.studentId}</span>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-hidden">
                  <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Outstanding</span>
                      <span className="font-semibold text-foreground">₱{totalDue.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">
                        {totalDuesNumber} unpaid due{totalDuesNumber !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="pt-1">
                      <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs h-9" onClick={() => onOpenDetail(record)}>
                        <Eye className="size-3.5" /> View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Desktop Layout (>= md) */}
            <Card 
              key={`desktop-${record.studentId}`}
              className="hidden md:flex group border-border bg-card hover:shadow-lg transition-all duration-300 h-full flex-col overflow-hidden"
            >
              <CardHeader className="px-5 pt-5 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <Badge variant="outline" className="flex items-center gap-1 text-xs px-2.5 py-1">
                        <MinusCircle className="h-3 w-3" />Unpaid
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-bold text-foreground leading-tight">
                      {record.userName}
                    </CardTitle>
                    <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                      <span>{record.studentId}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <div className="border-t border-border mx-5" />

              <CardContent className="px-5 py-4 flex-1 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center shrink-0">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                      Total Outstanding
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      ₱{totalDue.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                      # Dues
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {totalDuesNumber}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center shrink-0">
                    <MinusCircle className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                      Status
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      Unsettled
                    </p>
                  </div>
                </div>

                <div className="mt-auto pt-3 border-t border-border">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full justify-center gap-1.5 h-10 sm:h-9 text-xs font-semibold" 
                    onClick={() => onOpenDetail(record)}
                  >
                    <Eye className="h-3.5 w-3.5" /> View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )
      })}
    </div>
  )
}
