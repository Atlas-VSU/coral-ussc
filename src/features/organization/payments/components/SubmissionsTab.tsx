import { ITEMS_PER_PAGE } from "../config"
import { ProofOfPayment } from "../../fines/types"
import { ViewMode, ViewToggle } from "@/components/organization/ViewToggle"
import { CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { SearchInput } from "@/components/organization/SearchInput"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataPagination } from "@/components/organization/DataPagination"
import { SubmissionsCardView } from "./SubmissionsCardView"
import { SubmissionsTableView } from "./SubmissionsTableView"
import { Button } from "@/components/ui/button"
import { RefreshCcw } from "lucide-react"

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
  isLoading?: boolean
  refetchPayments: () => void
  isLoadingUnpaid: boolean
}

export function SubmissionsTab({
  filtered, paginated, totalPages, currentPage,
  search, filterStatus, viewMode,
  onPageChange, onSearchChange, onStatusChange, onViewChange, onOpenReview,
  isLoading, refetchPayments, isLoadingUnpaid
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
              placeholder="Search student..."
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
            <Button onClick={refetchPayments} variant="outline" disabled={isLoading || isLoadingUnpaid}>
              <RefreshCcw className={`mr-2 h-4 w-4 ${(isLoading || isLoadingUnpaid) ? 'animate-spin' : ''}`} />
              {(isLoading || isLoadingUnpaid) ? 'Refreshing...' : 'Refresh'}
            </Button>
            <ViewToggle viewMode={viewMode} onViewChange={onViewChange} />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {viewMode === "card" ? (
          <SubmissionsCardView paginated={paginated} onOpenReview={onOpenReview} isLoading={isLoading} />
        ) : (
          <SubmissionsTableView paginated={paginated} filtered={filtered} onOpenReview={onOpenReview} isLoading={isLoading} />
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
