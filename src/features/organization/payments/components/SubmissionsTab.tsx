import { ITEMS_PER_PAGE } from "../config"
import { ProofOfPayment } from "../../fines/types"
import { ViewMode } from "@/components/organization/general/ViewToggle"
import { CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { DataPagination } from "@/components/organization/general/DataPagination"
import { SubmissionsCardView } from "./SubmissionsCardView"
import { SubmissionsTableView } from "./SubmissionsTableView"

interface SubmissionsTabProps {
  paginated: ProofOfPayment[]
  totalPages: number
  currentPage: number
  viewMode: ViewMode
  onPageChange: (page: number) => void
  onOpenReview: (payment: ProofOfPayment) => void
  isLoading?: boolean
  totalCount: number
  filterStatus?: string
}

export function SubmissionsTab({
  paginated, totalPages, currentPage, viewMode,
  onPageChange, onOpenReview, isLoading, totalCount, filterStatus = "all"
}: SubmissionsTabProps) {

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
        </div>
      </CardHeader>

      <CardContent>
        {viewMode === "card" ? (
          <SubmissionsCardView paginated={paginated} onOpenReview={onOpenReview} isLoading={isLoading} filterStatus={filterStatus} />
        ) : (
          <SubmissionsTableView paginated={paginated} totalCount={totalCount} onOpenReview={onOpenReview} isLoading={isLoading} filterStatus={filterStatus} />
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
