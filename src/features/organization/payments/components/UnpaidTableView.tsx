"use client"

import { Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TableSkeleton } from "@/components/organization/Skeletons"
import { ClearanceStatus } from "../../clearance/types"

interface UnpaidTableViewProps {
  totalCount: number
  paginatedUnpaid: ClearanceStatus[]
  onOpenDetail: (r: ClearanceStatus) => void
  isLoading?: boolean
}

export function UnpaidTableView({ totalCount, paginatedUnpaid, onOpenDetail, isLoading }: UnpaidTableViewProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border">
            <TableHead>Student</TableHead>
            <TableHead className="text-center"># Dues</TableHead>
            <TableHead className="text-right">Total Outstanding</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={4} className="p-0 border-none">
                <TableSkeleton columns={4} rows={5} />
              </TableCell>
            </TableRow>
          ) : totalCount === 0  ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                No unpaid records found
              </TableCell>
            </TableRow>
          ) : (
            paginatedUnpaid.map((record, index) => {
                      let totalDue = 0
                let totalDuesNumber = 0
                for (const [key, value] of Object.entries(record.blockingItems)) {
                  if (value.status === "unpaid") {
                    totalDue += value.balance;
                    totalDuesNumber += 1;
                  }
                }
              return (
                <TableRow key={`${record.studentId || record.id || "no-id"}-table-${index}`} className="border-border">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{record.userName}</span>
                      <span className="text-xs text-muted-foreground">{record.studentId}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-sm">{totalDuesNumber}</TableCell>
                  <TableCell className="text-right text-sm font-medium">₱{totalDue.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => onOpenDetail(record)}>
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
