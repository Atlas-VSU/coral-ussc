"use client"

import { Check, Clock, X, Eye, PenLine } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { buildRequirementGroups } from "../utils/clearanceUtils"
import type { ClearanceStatus } from "../types"
import { useClearanceActions } from "../hooks/useClearanceAction"
import { useOnlinePaymentReview } from "../hooks/useOnlinePaymentReview"
import { ProofOfPayment } from "../../fines/types"

interface RequirementsBreakdownProps {
  clearance: ClearanceStatus
  onReviewPayment: (payment: ProofOfPayment) => void
  onLogPayment: (clearanceId: string) => void
}

export function RequirementsBreakdown({
  clearance,
  onReviewPayment,
  onLogPayment,
}: RequirementsBreakdownProps) {
  const groups = buildRequirementGroups(clearance.blockingItems)
  const pendingReviews = Object.entries(clearance.blockingItems)
    .filter(([_, item]) => item.pendingReview)
    .map(([refId, item]) => ({ refId, label: item.title }))
  
  const {pendingPayments, loading} = useOnlinePaymentReview(clearance)

  return (
    <div className="flex flex-col gap-3 py-4">
      {groups.map(group => {
        const StatusIcon = group.status === "cleared" ? Check : group.status === "pending" ? Clock : X
        return (
          <div
            key={group.name}
            className={cn(
              "rounded-md border p-3",
              group.status === "cleared" ? "border-success/30 bg-success/5"
              : group.status === "not_cleared" ? "border-destructive/30 bg-destructive/5"
              : "border-warning/30 bg-warning/5"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "flex size-6 items-center justify-center rounded-full",
                  group.status === "cleared" ? "bg-success/20" : group.status === "not_cleared" ? "bg-destructive/20" : "bg-warning/20"
                )}>
                  <StatusIcon className={cn("size-3", group.status === "cleared" ? "text-success" : group.status === "not_cleared" ? "text-destructive" : "text-warning-foreground")} />
                </div>
                <span className="text-sm font-semibold text-foreground">{group.name}</span>
              </div>
              <Badge variant={group.status === "cleared" ? "secondary" : group.status === "not_cleared" ? "destructive" : "outline"} className="capitalize text-xs">
                {group.status.replace("_", " ")}
              </Badge>
            </div>
            {group.items.length > 0 ? (
              <div className="flex flex-col gap-2 mt-1 pl-1">
                {group.items.map(item => {
                  const ItemIcon = item.status === "cleared" ? Check : item.status === "pending" ? Clock : X
                  return (
                    <div key={item.referenceId} className="flex items-start justify-between gap-2 text-xs">
                      <div className="flex min-w-0 flex-1 items-start gap-1.5 text-muted-foreground">
                        <ItemIcon className={cn("size-3 shrink-0", item.status === "cleared" ? "text-success" : item.status === "not_cleared" ? "text-destructive" : "text-warning-foreground")} />
                        <div className="min-w-0 flex-1">
                          <span className="break-words">{item.label}</span>
                          {item.amount != null && (
                            <span className="ml-1 whitespace-nowrap text-muted-foreground/60 max-[400px]:ml-0 max-[400px]:block">₱{item.amount}</span>
                          )}
                        </div>
                      </div>
                      <span className={cn(
                        "shrink-0 whitespace-nowrap pl-2 text-right font-medium capitalize",
                        item.status === "cleared" && "text-success",
                        item.status === "pending" && "text-warning-foreground",
                        item.status === "not_cleared" && "text-destructive",
                      )}>{item.status.replace("_", " ")}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground pl-1">No outstanding {group.name.toLowerCase()}.</p>
            )}
          </div>
        )
      })}
      {pendingReviews.length > 0 && pendingPayments.map((p, index) => (
          <Button
          key={p.id}
          size="sm"
          variant="outline"
          className="w-full gap-1.5 border-warning/40 text-warning-foreground hover:bg-warning/10"
          onClick={() => onReviewPayment(p)}
        >
          <Eye className="size-3.5" /> Review Payment{pendingPayments.length > 1 ? ` (${index+1})` : ""}
        </Button>
      ))}
      {Object.values(clearance.blockingItems).some(i => i.status === "unpaid") && (pendingPayments.length === 0) && (
        <Button
          size="sm"
          variant="outline"
          className="w-full gap-1.5 border-[#1B5E20]/40 text-[#1B5E20] hover:bg-[#C8E6C9] hover:text-[#1B5E20] dark:text-green-400 dark:border-green-500/30 dark:hover:bg-green-950"
          onClick={() => onLogPayment(clearance.id)}
        >
          <PenLine className="size-3.5" /> Log Payment Manually
        </Button>
      )}
    </div>
  )
}