import { Eye, MinusCircle } from "lucide-react"
import { ITEMS_PER_PAGE } from "../config"
import type { StudentUnpaidRecord } from "../types"
import { ViewMode, ViewToggle } from "@/components/organization/ViewToggle"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SearchInput } from "@/components/organization/SearchInput"
import { DataPagination } from "@/components/organization/DataPagination"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface UnpaidTabProps {
  filteredUnpaid: StudentUnpaidRecord[]
  paginatedUnpaid: StudentUnpaidRecord[]
  unpaidTotalPages: number
  unpaidPage: number
  unpaidSearch: string
  unpaidViewMode: ViewMode
  onPageChange: (page: number) => void
  onSearchChange: (value: string) => void
  onViewChange: (mode: ViewMode) => void
  onOpenDetail: (record: StudentUnpaidRecord) => void
}

export function UnpaidTab({
  filteredUnpaid, paginatedUnpaid, unpaidTotalPages, unpaidPage,
  unpaidSearch, unpaidViewMode,
  onPageChange, onSearchChange, onViewChange, onOpenDetail,
}: UnpaidTabProps) {
  return (
    <>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
              Students with Unpaid Dues
            </CardTitle>
            <CardDescription>{filteredUnpaid.length} student(s) found</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              placeholder="Search by name or ID..."
              value={unpaidSearch}
              onChange={v => { onSearchChange(v); onPageChange(1) }}
              className="w-full sm:w-64"
            />
            <ViewToggle viewMode={unpaidViewMode} onViewChange={onViewChange} />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {unpaidViewMode === "card" ? (
          <UnpaidCardView paginatedUnpaid={paginatedUnpaid} onOpenDetail={onOpenDetail} />
        ) : (
          <UnpaidTableView filteredUnpaid={filteredUnpaid} paginatedUnpaid={paginatedUnpaid} onOpenDetail={onOpenDetail} />
        )}
        <DataPagination
          currentPage={unpaidPage}
          totalPages={unpaidTotalPages}
          totalItems={filteredUnpaid.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={onPageChange}
        />
      </CardContent>
    </>
  )
}

// ─── Card view ────────────────────────────────────────────────────────────────
function UnpaidCardView({ paginatedUnpaid, onOpenDetail }: {
  paginatedUnpaid: StudentUnpaidRecord[]
  onOpenDetail: (r: StudentUnpaidRecord) => void
}) {
  if (paginatedUnpaid.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">No unpaid records found</p>
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {paginatedUnpaid.map(record => {
        const totalDue = record.dues.reduce((s, d) => s + d.item.balance, 0)
        return (
          <Card key={record.student.studentId} className="border-border bg-card">
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{record.student.firstName + " " + record.student.lastName}</p>
                  <p className="text-xs text-muted-foreground">{record.student.studentId}</p>
                </div>
                <Badge variant="outline" className="flex items-center gap-1 text-xs shrink-0">
                  <MinusCircle className="size-3" />Unpaid
                </Badge>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground"># Dues</p>
                  <p className="font-medium">{record.dues.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Outstanding</p>
                  <p className="font-medium">₱{totalDue.toLocaleString()}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs" onClick={() => onOpenDetail(record)}>
                <Eye className="size-3.5" /> View Details
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// ─── Table view ───────────────────────────────────────────────────────────────
function UnpaidTableView({ filteredUnpaid, paginatedUnpaid, onOpenDetail }: {
  filteredUnpaid: StudentUnpaidRecord[]
  paginatedUnpaid: StudentUnpaidRecord[]
  onOpenDetail: (r: StudentUnpaidRecord) => void
}) {
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
              const totalDue = record.dues.reduce((s, d) => s + d.item.balance, 0)
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
