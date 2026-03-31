import { ITEMS_PER_PAGE } from "../config"
import { ProofOfPayment } from "../../fines/types"
import { ViewMode, ViewToggle } from "@/components/organization/general/ViewToggle"
import { CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { SearchInput } from "@/components/organization/general/SearchInput"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataPagination } from "@/components/organization/general/DataPagination"
import { SubmissionsCardView } from "./SubmissionsCardView"
import { SubmissionsTableView } from "./SubmissionsTableView"
import { Button } from "@/components/ui/button"
import { RefreshCcw, Search } from "lucide-react"
import { useEffect, useState } from "react"

interface SubmissionsTabProps {
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
  totalCount: number
}

export function SubmissionsTab({
  paginated, totalPages, currentPage,
  search, filterStatus, viewMode,
  onPageChange, onSearchChange, onStatusChange, onViewChange, onOpenReview,
  isLoading, refetchPayments, isLoadingUnpaid, totalCount
}: SubmissionsTabProps) {

  const [localSearch, setLocalSearch] = useState(search);
  
  useEffect(() => {
    setLocalSearch(search)
  },[search])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault() // Prevent the page from refreshing
    onSearchChange(localSearch)
    onPageChange(1)
  }

  const handleRefresh = () => {
    setLocalSearch("");
    onPageChange(1);
    onSearchChange("");
    onStatusChange("all");
    refetchPayments();
  }

  return (
    <>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
              All Payment Submissions
            </CardTitle>
            <CardDescription>{totalCount} records found</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <SearchInput
                placeholder="Search by name or ID..."
                value={localSearch}
                onChange={v => setLocalSearch(v)} // Only update local state on keystroke
                className="w-full sm:w-64"
              />
              <Button type="submit" variant="secondary" size="icon" disabled={isLoading || isLoadingUnpaid}>
                <Search className="h-4 w-4" />
                <span className="sr-only">Search</span>
              </Button>
            </form>
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
            <Button onClick={handleRefresh} variant="outline" disabled={isLoading || isLoadingUnpaid}>
              <RefreshCcw className={`mr-2 h-4 w-4 ${(isLoading || isLoadingUnpaid) ? 'animate-spin' : ''}`} />
              {(isLoading || isLoadingUnpaid) ? 'Refreshing...' : 'Refresh'}
            </Button>
            <ViewToggle viewMode={viewMode} onViewChange={onViewChange} />
            <p className="text-sm text-muted-foreground">Page {currentPage} of {totalPages == 0 ? 1 : totalPages}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {viewMode === "card" ? (
          <SubmissionsCardView paginated={paginated} onOpenReview={onOpenReview} isLoading={isLoading} />
        ) : (
          <SubmissionsTableView paginated={paginated} totalCount={totalCount} onOpenReview={onOpenReview} isLoading={isLoading} />
        )}
        <DataPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={onPageChange}
        />
      </CardContent>
    </>
  )
}
