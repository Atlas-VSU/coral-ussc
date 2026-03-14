"use client"

import { Check, Clock, Eye, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { RequirementsBreakdown } from "./RequirementsBreakdown"
import { buildRequirementGroups } from "../utils/clearanceUtils"
import type { ClearanceStatus } from "../types"

interface ClearanceCardProps {
  clearance: ClearanceStatus
  onReviewPayment: (clearanceId: string, referenceId: string) => void
  onLogPayment: (clearanceId: string) => void
}

export function ClearanceCard({ clearance: c, onReviewPayment, onLogPayment }: ClearanceCardProps) {
  return (
    <Card key={c.id} className="border-border bg-card">
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-foreground">{c.userName}</p>
            <p className="text-xs text-muted-foreground">{c.studentId}</p>
          </div>
          <Badge variant={c.status === "cleared" ? "secondary" : c.status === "not_cleared" ? "destructive" : "outline"} className="capitalize shrink-0">
            {c.status.replace("_", " ")}
          </Badge>
        </div>
        <div className="flex flex-col gap-2">
          {buildRequirementGroups(c.blockingItems).map(g => {
            const Icon = g.status === "cleared" ? Check : g.status === "pending" ? Clock : X
            return (
              <div key={g.name} className={cn(
                "flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs",
                g.status === "cleared" && "bg-success/10",
                g.status === "pending" && "bg-warning/10",
                g.status === "not_cleared" && "bg-destructive/10",
              )}>
                <span className={cn(
                  "font-medium",
                  g.status === "cleared" && "text-success",
                  g.status === "pending" && "text-warning-foreground",
                  g.status === "not_cleared" && "text-destructive",
                )}>{g.name}</span>
                <Icon className={cn(
                  "size-3.5",
                  g.status === "cleared" && "text-success",
                  g.status === "pending" && "text-warning-foreground",
                  g.status === "not_cleared" && "text-destructive",
                )} />
              </div>
            )
          })}
        </div>
        <div className="mt-auto pt-1">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                <Eye className="size-3.5" /> View Details
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-foreground">Clearance — {c.userName}</DialogTitle>
                <DialogDescription className="text-muted-foreground">{c.studentId}</DialogDescription>
              </DialogHeader>
              <RequirementsBreakdown
                clearance={c}
                onReviewPayment={onReviewPayment}
                onLogPayment={onLogPayment}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
