"use client"

import { Eye } from "lucide-react"
import { statusConfig } from "../config"
import { ProofOfPayment } from "../../fines/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TableSkeleton } from "@/components/organization/skeleton/TableSkeleton"
import { EmptyState } from "@/components/organization/general/EmptyState"

interface SubmissionsTableViewProps {
  paginated: ProofOfPayment[]
  totalCount: number
  onOpenReview: (p: ProofOfPayment) => void
  isLoading?: boolean
  filterStatus?: string
}

export function SubmissionsTableView({ paginated, totalCount, onOpenReview, isLoading, filterStatus = "all" }: SubmissionsTableViewProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border">
            <TableHead>Student</TableHead>
            <TableHead className="hidden sm:table-cell">Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="hidden md:table-cell">Receipt ID</TableHead>
            <TableHead className="hidden sm:table-cell">Submitted</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={7} className="p-0 border-none">
                <TableSkeleton columns={7} rows={5} />
              </TableCell>
            </TableRow>
          ) : totalCount === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="p-0 border-none">
                <EmptyState filterStatus={filterStatus} type="submissions" />
              </TableCell>
            </TableRow>
          ) : (
            paginated.map(payment => {
              const cfg = statusConfig[payment.status]
              const StatusIcon = cfg.icon
              return (
                <TableRow key={payment.id?? "" + payment.submittedAt.toMillis()} className="border-border">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{payment.userName}</span>
                      <span className="text-xs text-muted-foreground">{payment.studentId}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-foreground hidden sm:table-cell">
                    {(payment.paymentType).toLocaleUpperCase()}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-foreground">
                    ₱{payment.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm font-mono text-foreground hidden md:table-cell">
                    {payment.receiptCode? payment.receiptCode: payment.referenceNumber}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                    {(payment.submittedAt).toDate().toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={cfg.variant} className="flex items-center gap-1 w-fit text-xs">
                      <StatusIcon className="size-3" />{cfg.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onOpenReview(payment)}>
                      <Eye className="size-3.5" /> View Details
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
