"use client"

import { Fragment } from "react"
import { Eye, Calendar, Hash } from "lucide-react"
import { statusConfig } from "../config"
import { ProofOfPayment } from "../../fines/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardGridSkeleton } from "@/components/organization/skeleton/CardGridSkeleton"
import { EmptyState } from "@/components/organization/general/EmptyState"

interface SubmissionsCardViewProps {
  paginated: ProofOfPayment[]
  onOpenReview: (p: ProofOfPayment) => void
  isLoading?: boolean
  filterStatus?: string
}

export function SubmissionsCardView({ paginated, onOpenReview, isLoading, filterStatus = "all" }: SubmissionsCardViewProps) {
  if (isLoading) {
    return <CardGridSkeleton count={6} />
  }
  if (paginated.length === 0) {
    return <EmptyState filterStatus={filterStatus} type="submissions" />
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {paginated.map(payment => {
        const cfg = statusConfig[payment.status]
        const StatusIcon = cfg.icon
        return (
          <Fragment key={payment.id ?? payment.submittedAt.toMillis()}>
            {/* Mobile Layout (< md) */}
            <Card
              className="md:hidden group hover:shadow-md active:shadow-sm transition-all duration-200 border-border bg-card overflow-hidden"
            >
              <CardContent className="p-0">
                <div className="w-full p-3 flex items-center gap-3 text-left active:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm text-foreground truncate">
                        {payment.userName}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant={cfg.variant} className="flex items-center gap-1 text-xs px-1.5 py-0.5">
                        <StatusIcon className="h-3 w-3" />{cfg.label}
                      </Badge>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{payment.studentId}</span>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-hidden">
                  <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-semibold text-foreground">₱{payment.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Hash className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="font-mono text-muted-foreground truncate">{payment.referenceNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">{payment.submittedAt.toDate().toLocaleDateString()}</span>
                    </div>
                    <div className="pt-1">
                      <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs h-9" onClick={() => onOpenReview(payment)}>
                        <Eye className="size-3.5" /> View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Desktop Layout (>= md) */}
            <Card
              className="hidden md:flex group border-border bg-card hover:shadow-lg transition-all duration-300 h-full flex-col overflow-hidden"
            >
              <CardHeader className="px-5 pt-5 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <Badge variant={cfg.variant} className="flex items-center gap-1 text-xs px-2.5 py-1">
                        <StatusIcon className="h-3 w-3" />{cfg.label}
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-bold text-foreground leading-tight">
                      {payment.userName}
                    </CardTitle>
                    <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                      <span>{payment.studentId}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <div className="border-t border-border mx-5" />
              
              <CardContent className="px-5 py-4 flex-1 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center shrink-0">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                      Payment Type
                    </p>
                    <p className="text-sm font-semibold text-foreground capitalize">
                      {payment.paymentType}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-muted-foreground">₱</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                      Amount Paid
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      ₱{payment.amount.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center shrink-0">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                      Reference Number
                    </p>
                    <p className="text-sm font-mono text-foreground truncate">
                      {payment.referenceNumber}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center shrink-0">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                      Submitted
                    </p>
                    <p className="text-sm text-foreground">
                      {payment.submittedAt.toDate().toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="mt-auto pt-3 border-t border-border">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full justify-center gap-1.5 h-10 sm:h-9 text-xs font-semibold" 
                    onClick={() => onOpenReview(payment)}
                  >
                    <Eye className="h-3.5 w-3.5" /> View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Fragment>
        )
      })}
    </div>
  )
}
