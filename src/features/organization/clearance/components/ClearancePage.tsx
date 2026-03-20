"use client"

import { toast } from "sonner"

// UI Components
import { PageHeader } from "@/components/organization/PageHeader"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DataPagination } from "@/components/organization/DataPagination"
import { PaymentReviewDialog } from "@/components/organization/PaymentReviewDialog"
import PaymentReceiptDialog from "@/components/organization/PaymentReceiptDialog"

// Local Components & Hooks
import { ClearanceStats } from "./ClearanceStats"
import { ClearanceFilters } from "./ClearanceFilters"
import { useClearancePage } from "../hooks/useClearancePage"
import { ClearanceCard } from "./ClearanceCard"
import { ClearanceTable } from "./ClearanceTable"
import { LogManualPaymentDialog } from "./LogManualPaymentDialog"
import { CardGridSkeleton } from "@/components/organization/Skeletons"

interface ClearancePageProps {
  orgId: string | undefined
}

export default function ClearancePage({ orgId }: ClearancePageProps) {
  const {
    clearances,
    loading,
    filtered,
    paginated,
    totalPages,
    reviewData,
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
    hardRefresh
  } = useClearancePage(orgId)

  return (
    <div className="flex flex-col gap-6 pt-8 pb-24 lg:pb-0">
      <PageHeader
      variant="admin"
        title="Clearance Management"
        context="2nd Semester · A.Y. 2025–2026"
        description="Review and manage student clearance statuses"
      />

      <ClearanceStats clearances={clearances} />

      <Card className="border-border bg-card">
        <CardHeader>
          <ClearanceFilters
            search={search}
            onSearchChange={setSearch}
            filterStatus={filterStatus}
            onFilterChange={setFilterStatus}
            onExport={() => toast.success("Export started (mock)")}
            viewMode={viewMode}
            onViewChange={setViewMode}
            onRefresh={hardRefresh}
            isLoading={loading}
          />
        </CardHeader>
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
            totalItems={filtered.length}
            itemsPerPage={10}
            onPageChange={setCurrentPage}
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