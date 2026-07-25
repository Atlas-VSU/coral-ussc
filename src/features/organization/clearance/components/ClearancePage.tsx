"use client"

import { toast } from "sonner"
import { useState, useEffect } from "react"

// UI Components
import { PageHeader } from "@/components/organization/general/PageHeader"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DataPagination } from "@/components/organization/general/DataPagination"
import { PaymentReviewDialog } from "@/components/organization/receipt/PaymentReviewDialog"
import PaymentReceiptDialog from "@/components/organization/receipt/PaymentReceiptDialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, Loader2, Users } from "lucide-react"

// Local Components & Hooks 
import { ClearanceStats } from "./ClearanceStats"
import { ClearanceFilters } from "./ClearanceFilters"
import { useClearancePage } from "../hooks/useClearancePage"
import { ClearanceCard } from "./ClearanceCard"
import { ClearanceTable } from "./ClearanceTable"
import { LogManualPaymentDialog } from "./LogManualPaymentDialog"
import { CardGridSkeleton } from "@/components/organization/skeleton/CardGridSkeleton"
import { ITEMS_PER_PAGE } from "../config"

interface ClearancePageProps {
  orgId: string | undefined
}

export default function ClearancePage({ orgId }: ClearancePageProps) {
  const [searchTerm, setSearchTerm] = useState("")
  
  const {
    clearances,
    loading,
    filtered,
    paginated,
    totalPages,
    totalCount,
    reviewData,
    stats, 
    search,
    AY,
    sem,
    setSearch,
    filterStatus,
    setFilterStatus,
    viewMode,
    setViewMode,
    currentPage,
    setCurrentPage,
    isProcessing,
    paymentReviewOpen,
    setPaymentReviewOpen,
    logPaymentOpen,
    setLogPaymentOpen,
    logPaymentTarget,
    receiptOpen,
    setReceiptOpen,
    receiptData,
    selection,
    openPaymentReview,
    handleApprovePayment,
    handleRejectPayment,
    openLogPayment,
    handleLogPayment,
    hardRefresh,
    hasNextPage,
    needsSeed,
    isSeeding,
    handleSeedClearance,
    handleExport,
    isExporting,
  } = useClearancePage(orgId)

  useEffect(() => {
    setSearchTerm(search)
  }, [search])

  const handleSearchCommit = () => {
    setSearch(searchTerm)
    setCurrentPage(1)
  }

  const handleSearchClear = () => {
    setSearchTerm("")
    setSearch("")
    setCurrentPage(1)
  }

  const handleRefresh = () => {
    setCurrentPage(1)
    setFilterStatus("all")
    handleSearchClear()
    hardRefresh()
  }

  return (
    <div className="flex flex-col gap-6 pb-5 lg:pb-0">
      <PageHeader
        variant="admin"
        title="Clearance Management"
        context={`${sem} Semester · A.Y. ${AY}`}
        description="Review and manage student clearance statuses"
      />

      <ClearanceStats stats={stats} />

      <ClearanceFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearchCommit={handleSearchCommit}
        onSearchClear={handleSearchClear}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        viewMode={viewMode}
        onViewChange={setViewMode}
        onRefresh={handleRefresh}
        onExport={handleExport}
        isExporting={isExporting}
        isLoading={loading}
        disabled={loading}
      />

      {/* Seed Banner — shown once when no records exist for this term */}
      {needsSeed && !loading && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-700 dark:text-amber-400">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">No clearance records found for {sem} · A.Y. {AY}</p>
              <p className="text-xs opacity-80">Generate clearance records for all students in this term to get started.</p>
            </div>
            <Button
              size="sm"
              className="mt-2 shrink-0 sm:mt-0 bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleSeedClearance}
              disabled={isSeeding}
            >
              {isSeeding ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…</>
              ) : (
                <><Users className="mr-2 h-4 w-4" /> Generate Records</>
              )}
            </Button>
          </div>
        </div>
      )}
      <Card className="border-border bg-card">
        <CardHeader></CardHeader>
        
        <CardContent>
          {viewMode === "card" ? (
            loading && clearances.length === 0 ? (
              <CardGridSkeleton count={6} />
            ) : paginated.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No clearance records found.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {paginated.map(c => (
                  <ClearanceCard
                    key={c.id}
                    clearance={c}
                    onReviewPayment={openPaymentReview}
                    onLogPayment={openLogPayment}
                  />
                ))}
              </div>
            )
          ) : (
            <ClearanceTable
              paginated={paginated}
              onReviewPayment={openPaymentReview}
              onLogPayment={openLogPayment}
              isLoading={loading && clearances.length === 0}
            />
          )}
          <DataPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalCount}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            hasNextPage={hasNextPage}
          />
        </CardContent>
      </Card>

      <PaymentReviewDialog
        open={paymentReviewOpen}
        onOpenChange={setPaymentReviewOpen}
        data={reviewData}
        onApprove={handleApprovePayment}
        onReject={handleRejectPayment}
        isProcessing={isProcessing}
      />

      <LogManualPaymentDialog
        open={logPaymentOpen}
        onOpenChange={setLogPaymentOpen}
        target={logPaymentTarget}
        selection={selection}
        isProcessing={isProcessing}
        onLogPayment={handleLogPayment}
      />

      <PaymentReceiptDialog
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        data={receiptData}
      />
    </div>
  )
}