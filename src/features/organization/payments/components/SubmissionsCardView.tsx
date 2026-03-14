"use client"

import { Eye } from "lucide-react"
import { statusConfig } from "../config"
import { ProofOfPayment } from "../../fines/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface SubmissionsCardViewProps {
  paginated: ProofOfPayment[]
  onOpenReview: (p: ProofOfPayment) => void
}

export function SubmissionsCardView({ paginated, onOpenReview }: SubmissionsCardViewProps) {
  if (paginated.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">No payment submissions found</p>
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {paginated.map(payment => {
        const cfg = statusConfig[payment.status]
        const StatusIcon = cfg.icon
        return (
          <Card key={payment.id} className="border-border bg-card flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-sm font-semibold">{payment.userName}</CardTitle>
                  <CardDescription className="text-xs">{payment.studentId}</CardDescription>
                </div>
                <Badge variant={cfg.variant} className="flex items-center gap-1 text-xs shrink-0">
                  <StatusIcon className="size-3" />{cfg.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-0 flex-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{payment.paymentType}</span>
                <span className="font-semibold">₱{payment.amount.toLocaleString()}</span>
              </div>
              <div className="text-xs text-muted-foreground font-mono">{payment.referenceNumber}</div>
              <div className="text-xs text-muted-foreground">{(payment.submittedAt).toDate().toLocaleDateString()}</div>
              <div className="mt-auto pt-2">
                <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={() => onOpenReview(payment)}>
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
