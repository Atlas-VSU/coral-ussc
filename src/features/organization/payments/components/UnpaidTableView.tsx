"use client"

import { Eye } from "lucide-react"
import type { StudentUnpaidRecord } from "../types"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface UnpaidTableViewProps {
  filteredUnpaid: StudentUnpaidRecord[]
  paginatedUnpaid: StudentUnpaidRecord[]
  onOpenDetail: (r: StudentUnpaidRecord) => void
}

export function UnpaidTableView({ filteredUnpaid, paginatedUnpaid, onOpenDetail }: UnpaidTableViewProps) {
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
          {filteredUnpaid.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                No unpaid records found
              </TableCell>
            </TableRow>
          ) : (
            paginatedUnpaid.map(record => {
              const totalDue = record.dues.reduce((s, d) => s + d.balance, 0)
              return (
                <TableRow key={record.student.studentId} className="border-border">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{record.student.firstName+ " "+ record.student.lastName}</span>
                      <span className="text-xs text-muted-foreground">{record.student.studentId}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-sm">{record.dues.length}</TableCell>
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
