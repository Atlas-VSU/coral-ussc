"use client"

import { TableSkeleton } from "@/components/organization/Skeletons"
import { Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { RequirementsBreakdown } from "./RequirementsBreakdown"
import { buildRequirementGroups } from "../utils/clearanceUtils"
import type { ClearanceStatus } from "../types"
import { ProofOfPayment } from "../../fines/types"

interface ClearanceTableProps {
  paginated: ClearanceStatus[]
  onReviewPayment: (payment: ProofOfPayment) => void
  onLogPayment: (clearanceId: string) => void
  isLoading?: boolean
}

export function ClearanceTable({ paginated, onReviewPayment, onLogPayment, isLoading }: ClearanceTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border">
            <TableHead>Student</TableHead>
            <TableHead>Requirements</TableHead>
            <TableHead>Overall Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={4} className="p-0 border-none">
                <TableSkeleton columns={4} rows={10} />
              </TableCell>
            </TableRow>
          ) : paginated.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                No clearance records found.
              </TableCell>
            </TableRow>
          ) : (
            paginated.map(c => (
            <TableRow key={c.id} className="border-border">
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{c.userName}</span>
                  <span className="text-xs text-muted-foreground">{c.studentId}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-1.5">
                  {buildRequirementGroups(c.blockingItems).map(g => (
                    <span
                      key={g.name}
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        g.status === "cleared" && "bg-success/10 text-success",
                        g.status === "pending" && "bg-warning/10 text-warning-foreground",
                        g.status === "not_cleared" && "bg-destructive/10 text-destructive",
                      )}
                    >
                      {g.name}
                    </span>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={c.status === "cleared" ? "secondary" : c.status === "not_cleared" ? "destructive" : "outline"} className="capitalize">
                  {c.status.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
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
              </TableCell>
            </TableRow>
          ))
        )}
          {/* {!isLoading && paginated.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                No clearance records found.
              </TableCell>
            </TableRow>
          )} */}
        </TableBody>
      </Table>
    </div>
  )
}
