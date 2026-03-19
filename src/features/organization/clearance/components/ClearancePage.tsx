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
  } = useClearancePage(orgId)

  return (
    <div className="flex flex-col gap-6 pb-24 lg:pb-0">
      <PageHeader
      variant="admin"
        title="Clearance Management"
        context="2nd Semester · A.Y. 2025–2026"
        description="Review and manage student clearance statuses"
      />

      <ClearanceStats clearances={clearances} />

      {loading && clearances.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="size-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            <p className="text-sm text-muted-foreground italic">Fetching clearance records...</p>
          </CardContent>
        </Card>
      ) : (
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
            />
          </CardHeader>
          <CardContent>
            {viewMode === "card" ? (
              paginated.length === 0 ? (
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
      )}

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