"use client"

import { toast } from "sonner"
import { useState, useEffect } from "react"

// UI Components
import { PageHeader } from "@/components/organization/general/PageHeader"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DataPagination } from "@/components/organization/general/DataPagination"
import { PaymentReviewDialog } from "@/components/organization/receipt/PaymentReviewDialog"
import PaymentReceiptDialog from "@/components/organization/receipt/PaymentReceiptDialog"

// Local Components & Hooks
import { ClearanceStats } from "./ClearanceStats"
import { ClearanceFilters } from "./ClearanceFilters"
import { useClearancePage } from "../hooks/useClearancePage"
import { ClearanceCard } from "./ClearanceCard"
import { ClearanceTable } from "./ClearanceTable"
import { LogManualPaymentDialog } from "./LogManualPaymentDialog"
import { CardGridSkeleton } from "@/components/organization/skeleton/CardGridSkeleton"

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
    hasNextPage
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
        context="2nd Semester · A.Y. 2025–2026"
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
        isLoading={loading}
        disabled={loading}
      />

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
            itemsPerPage={10}
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