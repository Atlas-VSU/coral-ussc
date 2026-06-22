"use client"

import { Check, Clock, Eye, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { RequirementsBreakdown } from "./RequirementsBreakdown"
import { buildRequirementGroups } from "../utils/clearanceUtils"
import type { ClearanceStatus } from "../types"
import { ProofOfPayment } from "../../fines/types"

interface ClearanceCardProps {
  clearance: ClearanceStatus
  onReviewPayment: (payment: ProofOfPayment) => void
  onLogPayment: (clearanceId: string) => void
}

export function ClearanceCard({ clearance: c, onReviewPayment, onLogPayment }: ClearanceCardProps) {
  const groups = buildRequirementGroups(c.blockingItems);
  
  return (
    <>
      {/* Mobile Layout (< md) */}
      <Card key={`mobile-${c.id}`} className="md:hidden group hover:shadow-md active:shadow-sm transition-all duration-200 border-border bg-card overflow-hidden">
        <CardContent className="p-0">
          <div className="w-full p-3 flex items-center gap-3 text-left active:bg-muted/50 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm text-foreground max-w-[150px] truncate line-clamp-2">
                  {c.userName}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge 
                  variant={c.status === "cleared" ? "secondary" : c.status === "not_cleared" ? "destructive" : "outline"} 
                  className="capitalize text-xs px-1.5 py-0.5"
                >
                  {c.status.replace("_", " ")}
                </Badge>
                <span className="text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">{c.studentId}</span>
              </div>
            </div>
          </div>
          
          <div className="overflow-hidden">
            <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
              {groups.slice(0, 3).map(g => {
                const Icon = g.status === "cleared" ? Check : g.status === "pending" ? Clock : X
                return (
                  <div key={g.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Icon className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        g.status === "cleared" && "text-success",
                        g.status === "pending" && "text-warning-foreground",
                        g.status === "not_cleared" && "text-destructive",
                      )} />
                      <span className="text-muted-foreground">{g.name}</span>
                    </div>
                    <span className={cn(
                      "font-semibold capitalize text-xs",
                      g.status === "cleared" && "text-success",
                      g.status === "pending" && "text-warning-foreground",
                      g.status === "not_cleared" && "text-destructive",
                    )}>
                      {g.status.replace("_", " ")}
                    </span>
                  </div>
                )
              })}
              <div className="pt-1">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs h-9">
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Layout (>= md) */}
      <Card key={`desktop-${c.id}`} className="hidden md:flex group border-border bg-card hover:shadow-lg transition-all duration-300 h-full flex-col overflow-hidden">
        <CardHeader className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-1.5 mb-3">
                <Badge 
                  variant={c.status === "cleared" ? "secondary" : c.status === "not_cleared" ? "destructive" : "outline"} 
                  className="capitalize text-xs px-2.5 py-1"
                >
                  {c.status.replace("_", " ")}
                </Badge>
              </div>
              <CardTitle className="text-base font-bold text-foreground leading-tight max-w-[200px] truncate">
                {c.userName}
              </CardTitle>
              <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                <span>{c.studentId}</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <div className="border-t border-border mx-5" />

        <CardContent className="px-5 py-4 flex-1 flex flex-col gap-4">
          {groups.map(g => {
            const Icon = g.status === "cleared" ? Check : g.status === "pending" ? Clock : X
            return (
              <div key={g.name} className="flex items-start gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  g.status === "cleared" && "bg-success/10",
                  g.status === "pending" && "bg-warning/10",
                  g.status === "not_cleared" && "bg-destructive/10",
                )}>
                  <Icon className={cn(
                    "h-4 w-4",
                    g.status === "cleared" && "text-success",
                    g.status === "pending" && "text-warning-foreground",
                    g.status === "not_cleared" && "text-destructive",
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                    {g.name}
                  </p>
                  <p className={cn(
                    "text-sm font-semibold capitalize",
                    g.status === "cleared" && "text-success",
                    g.status === "pending" && "text-warning-foreground",
                    g.status === "not_cleared" && "text-destructive",
                  )}>
                    {g.status.replace("_", " ")}
                  </p>
                </div>
              </div>
            )
          })}

          <div className="mt-auto pt-3 border-t border-border">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-center gap-1.5 h-10 sm:h-9 text-xs font-semibold">
                  <Eye className="h-3.5 w-3.5" /> View Details
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
    </>
  )
}
