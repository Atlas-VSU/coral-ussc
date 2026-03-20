import { ITEMS_PER_PAGE } from "../config"
import type { StudentUnpaidRecord } from "../types"
import { ViewMode, ViewToggle } from "@/components/organization/ViewToggle"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SearchInput } from "@/components/organization/SearchInput"
import { DataPagination } from "@/components/organization/DataPagination"
import { UnpaidCardView } from "./UnpaidCardView"
import { UnpaidTableView } from "./UnpaidTableView"
import { Button } from "@/components/ui/button"
import { RefreshCcw } from "lucide-react"

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
  isLoading: boolean
  refetchPayments: () => void
  isLoadingUnpaid: boolean
  totalCount: number
}

export function UnpaidTab({
  filteredUnpaid, paginatedUnpaid, unpaidTotalPages, unpaidPage,
  unpaidSearch, unpaidViewMode,
  onPageChange, onSearchChange, onViewChange, onOpenDetail, isLoading, refetchPayments, isLoadingUnpaid, totalCount
}: UnpaidTabProps) {
  
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
            <SearchInput
              placeholder="Search by name or ID..."
              value={unpaidSearch}
              onChange={v => { onSearchChange(v); onPageChange(1) }}
              className="w-full sm:w-64"
            />
            <Button onClick={refetchPayments} variant="outline" disabled={isLoading || isLoadingUnpaid}>
              <RefreshCcw className={`mr-2 h-4 w-4 ${(isLoading || isLoadingUnpaid) ? 'animate-spin' : ''}`} />
              {(isLoading || isLoadingUnpaid) ? 'Refreshing...' : 'Refresh'}
            </Button>
            <ViewToggle viewMode={unpaidViewMode} onViewChange={onViewChange} />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {unpaidViewMode === "card" ? (
          <UnpaidCardView paginatedUnpaid={paginatedUnpaid} onOpenDetail={onOpenDetail} isLoading={isLoading} />
        ) : (
          <UnpaidTableView filteredUnpaid={filteredUnpaid} paginatedUnpaid={paginatedUnpaid} onOpenDetail={onOpenDetail} isLoading={isLoading} />
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
