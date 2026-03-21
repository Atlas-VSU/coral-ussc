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
import PaymentReceiptDialog, { ReceiptData } from "@/components/organization/PaymentReceiptDialog"

export default function PaymentsPage() {
  const {
    // tab
    dataView, handleTabChange,
    // submissions
    search, setSearch, filterStatus, setFilterStatus,
    selectedPayment, setSelectedPayment,
    reviewOpen, setReviewOpen,
    viewMode, setViewMode,
    totalSubmissionCount, totalPages, paginated,
    handleApprove, handleDecline, openReview, isLoading, loading  , isLoadingUnpaid,
    refetchPayments, submissionPage, setSubmissionPage,
    // unpaid
    unpaidSearch, setUnpaidSearch,
    unpaidPage, setUnpaidPage,
    unpaidViewMode, setUnpaidViewMode,
    unpaidTotalPages, paginatedUnpaid,
    refreshAll,
    // unpaid detail
    detailOpen, setDetailOpen,
    liveSelectedUnpaid,
    checkedDues, selectedDues, selectedTotal,
    paymentDate, setPaymentDate,
    toggleDue, toggleAllDues, openUnpaidDetail, handleLogPayment,
    studentProgram,
    // receipt
    receiptOpen, setReceiptOpen, receiptData, setReceiptData,
    stats, totalUnpaidCount
  } = usePaymentsPage()

  const handleViewReceipt = () => {
    setReceiptData({
      receiptId: selectedPayment?.receiptCode || "N/A",
      studentName: selectedPayment?.userName || "N/A",
      studentId: selectedPayment?.studentId || "N/A",
      items: selectedPayment?.metadata.items?.map(d => ({ name: d.title, type: d.paymentType as "fees" | "fines", amount: d.amount })) ?? [],
      total: selectedPayment?.amount || 0,
      date: selectedPayment?.submittedAt.toDate().toLocaleDateString() || "N/A",
      verifiedByName: selectedPayment?.verifiedByName || "N/A",
      paymentMethod: selectedPayment?.paymentMethod || "Cash (Manual)",
    });
    setReceiptOpen(true)
  }

  return (
    <div className="flex flex-col gap-6 pb-24 lg:pb-0">
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
            <TabsList className="grid w-full grid-cols-2 max-[510px]:h-auto max-[510px]:grid-cols-1">
              <TabsTrigger value="submissions" className="w-full max-[510px]:justify-center">
                Payment Submissions
              </TabsTrigger>
              <TabsTrigger value="unpaid" className="w-full max-[510px]:justify-center">
                Log Payments Manually
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {dataView === "submissions" ? (
          <SubmissionsTab
            paginated={paginated}
            totalPages={totalPages}
            currentPage={submissionPage}
            search={search}
            filterStatus={filterStatus}
            viewMode={viewMode}
            onPageChange={setSubmissionPage}
            onSearchChange={setSearch}
            onStatusChange={setFilterStatus}
            onViewChange={setViewMode}
            onOpenReview={openReview}
            isLoading={isLoading}
            refetchPayments={refetchPayments}
            isLoadingUnpaid={isLoadingUnpaid}
            totalCount={totalSubmissionCount}
          />
        ) : (
          <UnpaidTab
            paginatedUnpaid={paginatedUnpaid}
            unpaidTotalPages={unpaidTotalPages}
            unpaidPage={unpaidPage}
            unpaidSearch={unpaidSearch}
            unpaidViewMode={unpaidViewMode}
            onPageChange={setUnpaidPage}
            onSearchChange={setUnpaidSearch}
            onViewChange={setUnpaidViewMode}
            onOpenDetail={openUnpaidDetail}
            isLoading={isLoadingUnpaid}
            refetchPayments={refreshAll}
            isLoadingUnpaid={isLoadingUnpaid}
            totalCount={totalUnpaidCount}
          />
        )}
      </Card>

      {/* ── Review Dialog ── */}
      <PaymentReviewDialog
        open={reviewOpen}
        onOpenChange={open => { setReviewOpen(open); if (!open) setSelectedPayment(null) }}
        data={selectedPayment ? {
          studentName: selectedPayment.userName,
          studentId: selectedPayment.studentId,
          typeLabel: selectedPayment.paymentType,
          lineItems: selectedPayment.metadata?.items?.map(i => ({ label: i.title, sublabel: i.paymentType, amount: i.amount, group: i.paymentType })) ?? [],
          showLineItemsTotal: !!(selectedPayment.metadata?.items?.length),
          amountPaid: selectedPayment.amount,
          referenceNo: selectedPayment.referenceNumber,
          submittedAt: selectedPayment.submittedAt.toDate().toLocaleDateString(),
          notes: selectedPayment.notes,
          receiptContent: selectedPayment.imageUrl,
          declineRemarks: selectedPayment.rejectionReason,
          reviewedBy: selectedPayment.verifiedByName,
          reviewedAt: selectedPayment.verifiedAt?.toDate().toLocaleDateString(),
          paymentMethod: selectedPayment.paymentMethod,
        } : null}
        onApprove={selectedPayment?.status === "pending" ? (async () => await handleApprove(selectedPayment)) : undefined}
        onReject={selectedPayment?.status === "pending" ? (async (reason: string) => await handleDecline(selectedPayment, reason)) : undefined}
        onViewReceipt={handleViewReceipt}
        isProcessing={isLoading}
        isLoading={loading}
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
        isLoading={isLoading}
        isSubmitting={loading}
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