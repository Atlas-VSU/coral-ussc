"use client"

import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/organization/PageHeader"
import { PaymentReviewDialog } from "@/components/organization/PaymentReviewDialog"
import { PaymentStats } from "./components/PaymentStats"
import { SubmissionsTab } from "./components/SubmissionsTab"
import { UnpaidTab } from "./components/UnpaidTab"
import { LogPaymentDialog } from "./components/LogPaymentDialog"
import { usePaymentsPage } from "./hooks/usePaymentsPage"
import PaymentReceiptDialog from "@/components/organization/PaymentReceiptDialog"

export default function PaymentsPage() {
  const {
    // tab
    dataView, handleTabChange,
    // submissions
    search, setSearch, filterStatus, setFilterStatus,
    selectedPayment, setSelectedPayment,
    currentPage, setCurrentPage,
    reviewOpen, setReviewOpen,
    viewMode, setViewMode,
    filtered, totalPages, paginated,
    handleApprove, handleDecline, openReview, isLoading, loading,
    // unpaid
    unpaidSearch, setUnpaidSearch,
    unpaidPage, setUnpaidPage,
    unpaidViewMode, setUnpaidViewMode,
    filteredUnpaid, unpaidTotalPages, paginatedUnpaid,
    // unpaid detail
    detailOpen, setDetailOpen,
    liveSelectedUnpaid,
    checkedDues, selectedDues, selectedTotal,
    paymentDate, setPaymentDate,
    toggleDue, toggleAllDues, openUnpaidDetail, handleLogPayment,
    studentProgram,
    // receipt
    receiptOpen, setReceiptOpen, receiptData,
    stats,
  } = usePaymentsPage()

  return (
    <div className="flex flex-col gap-6">

      <PageHeader
        variant="admin"
        title="Payment Submissions"
        context="2nd Semester · A.Y. 2025–2026"
        description="Review and manage student payment submissions"
      />

      <PaymentStats {...stats} />

      {/* ── Main Card ── */}
      <Card className="border-border bg-card">
        <div className="px-6 pt-6">
          <Tabs value={dataView} onValueChange={v => handleTabChange(v as "submissions" | "unpaid")}>
            <TabsList className="w-full flex-1">
              <TabsTrigger value="submissions">Payment Submissions</TabsTrigger>
              <TabsTrigger value="unpaid">Log Payments Manually</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {dataView === "submissions" ? (
          <SubmissionsTab
            filtered={filtered}
            paginated={paginated}
            totalPages={totalPages}
            currentPage={currentPage}
            search={search}
            filterStatus={filterStatus}
            viewMode={viewMode}
            onPageChange={setCurrentPage}
            onSearchChange={setSearch}
            onStatusChange={setFilterStatus}
            onViewChange={setViewMode}
            onOpenReview={openReview}
          />
        ) : (
          <UnpaidTab
            filteredUnpaid={filteredUnpaid}
            paginatedUnpaid={paginatedUnpaid}
            unpaidTotalPages={unpaidTotalPages}
            unpaidPage={unpaidPage}
            unpaidSearch={unpaidSearch}
            unpaidViewMode={unpaidViewMode}
            onPageChange={setUnpaidPage}
            onSearchChange={setUnpaidSearch}
            onViewChange={setUnpaidViewMode}
            onOpenDetail={openUnpaidDetail}
          />
        )}
      </Card>

      {/* ── Review Dialog ── */}
      <PaymentReviewDialog
        open={reviewOpen}
        onOpenChange={open => { setReviewOpen(open); if (!open) setSelectedPayment(null) }}
        data={selectedPayment ? {
          studentName:  selectedPayment.userName,
          studentId:    selectedPayment.studentId,
          typeLabel: selectedPayment.paymentType,
          lineItems: selectedPayment.metadata?.items?.map(i => ({ label: i.title, sublabel: i.paymentType, amount: i.amount, group:i.paymentType }))?? [],
          showLineItemsTotal: !!(selectedPayment.metadata?.items?.length),
          amountPaid:   selectedPayment.amount,
          referenceNo:  selectedPayment.referenceNumber,
          submittedAt:  selectedPayment.submittedAt.toDate().toLocaleDateString(),
          receiptContent: selectedPayment.imageUrl,
          declineRemarks: selectedPayment.rejectionReason,
          reviewedBy:   selectedPayment.verifiedByName,
          reviewedAt: selectedPayment.verifiedAt?.toDate().toLocaleDateString(),
          paymentMethod:selectedPayment.paymentMethod,
        } : null}
        // onApprove={selectedPayment?.status === "pending" ? () => handleApprove(selectedPayment!.id) : undefined}
        // onReject={selectedPayment?.status === "pending"  ? reason => handleDecline(selectedPayment!.id, reason) : undefined}
      />

      {/* ── Log Payment Dialog ── */}
      <LogPaymentDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        record={liveSelectedUnpaid}
        checkedDues={checkedDues}
        selectedDues={selectedDues}
        selectedTotal={selectedTotal}
        paymentDate={paymentDate}
        onPaymentDateChange={setPaymentDate}
        onToggleDue={toggleDue}
        onToggleAll={toggleAllDues}
        onLogPayment={handleLogPayment}
        studentProgram={studentProgram}
        isLoading = {loading}
      />

      {/* ── Receipt Dialog ── */}
      <PaymentReceiptDialog
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        data={receiptData}
      />

    </div>
  )
}
