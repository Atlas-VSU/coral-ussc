import { useState, useEffect } from "react" // 1. Import hooks
import { ITEMS_PER_PAGE } from "../config"
import { ViewMode, ViewToggle } from "@/components/organization/ViewToggle"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SearchInput } from "@/components/organization/SearchInput"
import { DataPagination } from "@/components/organization/DataPagination"
import { UnpaidCardView } from "./UnpaidCardView"
import { UnpaidTableView } from "./UnpaidTableView"
import { Button } from "@/components/ui/button"
import { RefreshCcw, Search } from "lucide-react" // 2. Added Search icon (optional)
import { ClearanceStatus } from "../../clearance/types"

interface UnpaidTabProps {
  paginatedUnpaid: ClearanceStatus[]
  unpaidTotalPages: number
  unpaidPage: number
  unpaidSearch: string
  unpaidViewMode: ViewMode
  onPageChange: (page: number) => void
  onSearchChange: (value: string) => void
  onViewChange: (mode: ViewMode) => void
  onOpenDetail: (record: ClearanceStatus) => void
  isLoading: boolean
  refetchPayments: () => void
  isLoadingUnpaid: boolean
  totalCount: number
}

export function UnpaidTab({
  paginatedUnpaid, unpaidTotalPages, unpaidPage,
  unpaidSearch, unpaidViewMode,
  onPageChange, onSearchChange, onViewChange, onOpenDetail, isLoading, refetchPayments, isLoadingUnpaid, totalCount
}: UnpaidTabProps) {
  
  // 3. Create a local state to hold the user's draft input
  const [localSearch, setLocalSearch] = useState(unpaidSearch)

  // 4. Keep local state in sync if the search is cleared from outside the component
  useEffect(() => {
    setLocalSearch(unpaidSearch)
  }, [unpaidSearch])

  // 5. Handle the submission (Enter key OR Button click)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault() // Prevent the page from refreshing
    onSearchChange(localSearch)
    onPageChange(1)
  }

  return (
    <>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
              Students with Unpaid Dues
            </CardTitle>
            <CardDescription>{totalCount} student(s) found</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <SearchInput
                placeholder="Search by name or ID..."
                value={localSearch}
                onChange={v => setLocalSearch(v)} 
                className="w-full sm:w-64"
              />
              <Button type="submit" variant="secondary" size="icon" disabled={isLoading || isLoadingUnpaid}>
                <Search className="h-4 w-4" />
                <span className="sr-only">Search</span>
              </Button>
            </form>

            <Button onClick={refetchPayments} variant="outline" disabled={isLoading || isLoadingUnpaid}>
              <RefreshCcw className={`mr-2 h-4 w-4 ${(isLoading || isLoadingUnpaid) ? 'animate-spin' : ''}`} />
              {(isLoading || isLoadingUnpaid) ? 'Refreshing...' : 'Refresh'}
            </Button>
            <ViewToggle viewMode={unpaidViewMode} onViewChange={onViewChange} />
            <p className="text-sm text-muted-foreground">Page {unpaidPage} of {unpaidTotalPages}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {unpaidViewMode === "card" ? (
          <UnpaidCardView paginatedUnpaid={paginatedUnpaid} onOpenDetail={onOpenDetail} isLoading={isLoading} />
        ) : (
          <UnpaidTableView totalCount={totalCount} paginatedUnpaid={paginatedUnpaid} onOpenDetail={onOpenDetail} isLoading={isLoading} />
        )}
        <DataPagination
          currentPage={unpaidPage}
          totalPages={unpaidTotalPages}
          totalItems={totalCount}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={onPageChange}
        />
      </CardContent>
    </>
  )
}