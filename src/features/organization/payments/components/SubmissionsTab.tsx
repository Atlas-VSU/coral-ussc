import { Eye } from "lucide-react"
import { statusConfig, ITEMS_PER_PAGE } from "../config"
// import { derivePaymentTypeLabel } from "../utils"
import { ProofOfPayment } from "../../fines/types"
import { ViewMode, ViewToggle } from "@/components/organization/ViewToggle"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SearchInput } from "@/components/organization/SearchInput"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataPagination } from "@/components/organization/DataPagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface SubmissionsTabProps {
  filtered: ProofOfPayment[]
  paginated: ProofOfPayment[]
  totalPages: number
  currentPage: number
  search: string
  filterStatus: string
  viewMode: ViewMode
  onPageChange: (page: number) => void
  onSearchChange: (value: string) => void
  onStatusChange: (value: string) => void
  onViewChange: (mode: ViewMode) => void
  onOpenReview: (payment: ProofOfPayment) => void
}

export function SubmissionsTab({
  filtered, paginated, totalPages, currentPage,
  search, filterStatus, viewMode,
  onPageChange, onSearchChange, onStatusChange, onViewChange, onOpenReview,
}: SubmissionsTabProps) {
  return (
    <>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
              All Payment Submissions
            </CardTitle>
            <CardDescription>{filtered.length} records found</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              placeholder="Search student or reference..."
              value={search}
              onChange={v => { onSearchChange(v); onPageChange(1) }}
              className="w-full sm:w-64"
            />
            <Select value={filterStatus} onValueChange={v => { onStatusChange(v); onPageChange(1) }}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Approved</SelectItem>
                <SelectItem value="rejected">Declined</SelectItem>
              </SelectContent>
            </Select>
            <ViewToggle viewMode={viewMode} onViewChange={onViewChange} />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {viewMode === "card" ? (
          <SubmissionsCardView paginated={paginated} onOpenReview={onOpenReview} />
        ) : (
          <SubmissionsTableView paginated={paginated} filtered={filtered} onOpenReview={onOpenReview} />
        )}
        <DataPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={onPageChange}
        />
      </CardContent>
    </>
  )
}

// ─── Card view ───────────────────────────────────────────────────────────────
function SubmissionsCardView({ paginated, onOpenReview }: {
  paginated: ProofOfPayment[]
  onOpenReview: (p: ProofOfPayment) => void
}) {
  if (paginated.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">No payment submissions found</p>
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {paginated.map(payment => {
        const cfg = statusConfig[payment.status]
        const StatusIcon = cfg.icon
        return (
          <Card key={payment.id} className="border-border bg-card flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-sm font-semibold">{payment.userName}</CardTitle>
                  <CardDescription className="text-xs">{payment.studentId}</CardDescription>
                </div>
                <Badge variant={cfg.variant} className="flex items-center gap-1 text-xs shrink-0">
                  <StatusIcon className="size-3" />{cfg.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-0 flex-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{payment.paymentType}</span>
                <span className="font-semibold">₱{payment.amount.toLocaleString()}</span>
              </div>
              <div className="text-xs text-muted-foreground font-mono">{payment.referenceNumber}</div>
              <div className="text-xs text-muted-foreground">{(payment.submittedAt).toDate().toLocaleDateString()}</div>
              <div className="mt-auto pt-2">
                <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={() => onOpenReview(payment)}>
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

// ─── Table view ───────────────────────────────────────────────────────────────
function SubmissionsTableView({ paginated, filtered, onOpenReview }: {
  paginated: ProofOfPayment[]
  filtered: ProofOfPayment[]
  onOpenReview: (p: ProofOfPayment) => void
}) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border">
            <TableHead>Student</TableHead>
            <TableHead className="hidden sm:table-cell">Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="hidden md:table-cell">Reference Code</TableHead>
            <TableHead className="hidden sm:table-cell">Submitted</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                No payment submissions found
              </TableCell>
            </TableRow>
          ) : (
            paginated.map(payment => {
              const cfg = statusConfig[payment.status]
              const StatusIcon = cfg.icon
              return (
                <TableRow key={payment.id} className="border-border">
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
                    {payment.referenceNumber}
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
