"use client"

import { Eye, Calendar, Hash } from "lucide-react"
import { statusConfig } from "../config"
import { ProofOfPayment } from "../../fines/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { CardGridSkeleton } from "@/components/organization/Skeletons"

interface SubmissionsCardViewProps {
  paginated: ProofOfPayment[]
  onOpenReview: (p: ProofOfPayment) => void
  isLoading?: boolean
}

export function SubmissionsCardView({ paginated, onOpenReview, isLoading }: SubmissionsCardViewProps) {
  if (isLoading) {
    return <CardGridSkeleton count={6} />
  }
  if (paginated.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">No payment submissions found</p>
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {paginated.map(payment => {
        const cfg = statusConfig[payment.status]
        const StatusIcon = cfg.icon
        return (
          <Card key={payment.id} className="border-border bg-card flex flex-col hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3 max-[420px]:flex-col max-[420px]:items-start">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base font-semibold truncate">{payment.userName}</CardTitle>
                  <CardDescription className="text-xs mt-0.5">{payment.studentId}</CardDescription>
                </div>
                <Badge variant={cfg.variant} className="flex items-center gap-1 text-xs shrink-0 whitespace-nowrap max-[420px]:self-start">
                  <StatusIcon className="size-3" />{cfg.label}
                </Badge>
              </div>
            </CardHeader>
            
            <Separator className="mx-0" />
            
            <CardContent className="flex flex-col gap-3 pt-3 flex-1">
              {/* Amount */}
              <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2.5">
                <p className="text-xs text-muted-foreground">Amount Paid</p>
                <p className="text-lg font-semibold text-foreground">₱{payment.amount.toLocaleString()}</p>
              </div>

              {/* Details */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-[9px] font-medium uppercase tracking-wider text-foreground bg-muted rounded px-1.5 py-0.5">
                    {payment.paymentType}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Hash className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="font-mono text-muted-foreground truncate">{payment.referenceNumber}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{(payment.submittedAt).toDate().toLocaleDateString()}</span>
                </div>
              </div>

              {/* Action */}
              <div className="mt-auto pt-2 pb-1">
                <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs" onClick={() => onOpenReview(payment)}>
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
