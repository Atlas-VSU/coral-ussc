import { ITEMS_PER_PAGE } from "../config"
import { ViewMode } from "@/components/organization/general/ViewToggle"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataPagination } from "@/components/organization/general/DataPagination"
import { UnpaidCardView } from "./UnpaidCardView"
import { UnpaidTableView } from "./UnpaidTableView"
import { ClearanceStatus } from "../../clearance/types"

interface UnpaidTabProps {
  paginatedUnpaid: ClearanceStatus[]
  unpaidTotalPages: number
  unpaidPage: number
  unpaidViewMode: ViewMode
  onPageChange: (page: number) => void
  onViewChange: (mode: ViewMode) => void
  onOpenDetail: (record: ClearanceStatus) => void
  isLoading: boolean
  totalCount: number
}

export function UnpaidTab({
  paginatedUnpaid, unpaidTotalPages, unpaidPage,
  unpaidViewMode,
  onPageChange, onViewChange, onOpenDetail, isLoading, totalCount
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