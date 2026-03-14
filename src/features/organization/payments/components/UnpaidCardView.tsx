"use client"

import { Eye, MinusCircle } from "lucide-react"
import type { StudentUnpaidRecord } from "../types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

interface UnpaidCardViewProps {
  paginatedUnpaid: StudentUnpaidRecord[]
  onOpenDetail: (r: StudentUnpaidRecord) => void
}

export function UnpaidCardView({ paginatedUnpaid, onOpenDetail }: UnpaidCardViewProps) {
  if (paginatedUnpaid.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">No unpaid records found</p>
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {paginatedUnpaid.map(record => {
        const totalDue = record.dues.reduce((s, d) => s + d.item.balance, 0)
        return (
          <Card key={record.student.studentId} className="border-border bg-card">
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{record.student.firstName + " " + record.student.lastName}</p>
                  <p className="text-xs text-muted-foreground">{record.student.studentId}</p>
                </div>
                <Badge variant="outline" className="flex items-center gap-1 text-xs shrink-0">
                  <span className="flex items-center gap-1"><MinusCircle className="size-3" />Unpaid</span>
                </Badge>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground"># Dues</p>
                  <p className="font-medium">{record.dues.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Outstanding</p>
                  <p className="font-medium">₱{totalDue.toLocaleString()}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs" onClick={() => onOpenDetail(record)}>
                <Eye className="size-3.5" /> View Details
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
