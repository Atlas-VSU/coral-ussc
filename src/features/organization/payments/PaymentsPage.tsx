"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/organization/general/PageHeader"
import { PaymentReviewDialog } from "@/components/organization/receipt/PaymentReviewDialog"
import { PaymentStats } from "./components/PaymentStats"
import { PaymentsFilters } from "./components/PaymentsFilters"
import { SubmissionsTab } from "./components/SubmissionsTab"
import { UnpaidTab } from "./components/UnpaidTab"
import { LogPaymentDialog } from "./components/LogPaymentDialog"
import { usePaymentsPage } from "./hooks/usePaymentsPage"
import PaymentReceiptDialog, { ReceiptData } from "@/components/organization/receipt/PaymentReceiptDialog"
import { Timestamp } from "firebase/firestore"

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
    refetchPayments,refetchUnpaids, submissionPage, setSubmissionPage,
    // unpaid
    unpaidSearch, setUnpaidSearch,
    unpaidPage, setUnpaidPage,
    unpaidViewMode, setUnpaidViewMode,
    unpaidTotalPages, filteredUnpaid,
    refreshAll,
    // unpaid detail
    detailOpen, setDetailOpen,
    liveSelectedUnpaid,
    checkedDues, selectedDues, selectedTotal,
    paymentDate, setPaymentDate,
    toggleDue, toggleAllDues, openUnpaidDetail, handleLogPayment,
    student, studentProgram,
    // receipt
    receiptOpen, setReceiptOpen, receiptData, setReceiptData,
    stats, totalUnpaidCount
  } = usePaymentsPage()

  // Local search states for filters
  const [searchTerm, setSearchTerm] = useState(search)
  const [unpaidSearchTerm, setUnpaidSearchTerm] = useState(unpaidSearch)

  // Sync with hook state
  useEffect(() => {
    setSearchTerm(search)
  }, [search])

  useEffect(() => {
    setUnpaidSearchTerm(unpaidSearch)
  }, [unpaidSearch])

  // Submissions tab handlers
  const handleSearchCommit = () => {
    setSearch(searchTerm)
    setSubmissionPage(1)
  }

  const handleSearchClear = () => {
    setSearchTerm("")
    setSearch("")
    setSubmissionPage(1)
  }

  const handleSubmissionsRefresh = () => {
    handleSearchClear()
    setFilterStatus("all")
    refetchPayments()
  }

  // Unpaid tab handlers
  const handleUnpaidSearchCommit = () => {
    setUnpaidSearch(unpaidSearchTerm)
    setUnpaidPage(1)
  }

  const handleUnpaidSearchClear = () => {
    setUnpaidSearchTerm("")
    setUnpaidSearch("")
    setUnpaidPage(1)
  }

  const handleUnpaidRefresh = () => {
    handleUnpaidSearchClear()
    refetchUnpaids()
  }

  const handleViewReceipt = () => {
    setReceiptData({
      receiptId: selectedPayment?.receiptCode || "N/A",
      studentName: selectedPayment?.userName || "N/A",
      studentId: selectedPayment?.studentId || "N/A",
      items: selectedPayment?.metadata.items?.map(d => ({ name: d.title, type: d.paymentType as "fees" | "fines", amount: d.amount })) ?? [],
      total: selectedPayment?.amount || 0,
      date: selectedPayment?.verifiedAt!.toDate().toLocaleString() || "N/A",
      verifiedByName: selectedPayment?.verifiedByName || "N/A",
      paymentMethod: selectedPayment?.paymentMethod || "Cash",
    });
    setReceiptOpen(true)
  }

  const handleRefresh = async () => {
    setUnpaidSearch("");
    setUnpaidPage(1);
    setFilterStatus("all");
    if (dataView === "submissions") {
      await refetchPayments();
    } else {
      await refetchUnpaids();
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-5 lg:pb-0">
      <PageHeader
        variant="admin"
        title="Payment Submissions"
        context="2nd Semester · A.Y. 2025–2026"
        description="Review and manage student payment submissions"
      />

      <PaymentStats {...stats} />

      {/* ── Filters (Outside Card) ── */}
      {dataView === "submissions" ? (
        <PaymentsFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearchCommit={handleSearchCommit}
          onSearchClear={handleSearchClear}
          statusFilter={filterStatus}
          onStatusChange={(v) => {
            setFilterStatus(v)
            setSubmissionPage(1)
          }}
          viewMode={viewMode}
          onViewChange={setViewMode}
          onRefresh={handleSubmissionsRefresh}
          disabled={isLoading || isLoadingUnpaid}
          showStatusFilter={true}
        />
      ) : (
        <PaymentsFilters
          searchTerm={unpaidSearchTerm}
          onSearchChange={setUnpaidSearchTerm}
          onSearchCommit={handleUnpaidSearchCommit}
          onSearchClear={handleUnpaidSearchClear}
          statusFilter="all"
          onStatusChange={() => {}}
          viewMode={unpaidViewMode}
          onViewChange={setUnpaidViewMode}
          onRefresh={handleUnpaidRefresh}
          disabled={isLoading || isLoadingUnpaid}
          showStatusFilter={false}
        />
      )}

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
            viewMode={viewMode}
            onPageChange={setSubmissionPage}
            onOpenReview={openReview}
            isLoading={isLoading}
            totalCount={totalSubmissionCount}
            filterStatus={filterStatus}
          />
        ) : (
          <UnpaidTab
            paginatedUnpaid={filteredUnpaid}
            unpaidTotalPages={unpaidTotalPages}
            unpaidPage={unpaidPage}
            unpaidViewMode={unpaidViewMode}
            onPageChange={setUnpaidPage}
            onViewChange={setUnpaidViewMode}
            onOpenDetail={openUnpaidDetail}
            isLoading={isLoadingUnpaid}
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
          submittedAt: selectedPayment.submittedAt.toDate().toLocaleString(),
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
        paymentDate={paymentDate.toDate().toISOString().slice(0, 10)}
        onPaymentDateChange={(date) => setPaymentDate(Timestamp.fromDate(new Date(date)))}
        onToggleDue={toggleDue}
        onToggleAll={toggleAllDues}
        onLogPayment={handleLogPayment}
        student={student}
        studentProgram = {studentProgram}
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