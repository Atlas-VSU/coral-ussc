"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle, Loader2 } from "lucide-react"
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
import { useTermPeriod } from "../term/hooks/useTermPeriod"

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
    stats, totalUnpaidCount, AY, sem,
    // portal payment acceptance
    isAcceptingPayments,
    isLoadingPaymentAcceptance,
    isUpdatingPaymentAcceptance,
    handleTogglePaymentAcceptance,
  } = usePaymentsPage()

  const { selected } = useTermPeriod();

  // Local search states for filters
  const [searchTerm, setSearchTerm] = useState(search)
  const [unpaidSearchTerm, setUnpaidSearchTerm] = useState(unpaidSearch)
  const [confirmToggleOpen, setConfirmToggleOpen] = useState(false)
  const [pendingToggleValue, setPendingToggleValue] = useState<boolean | null>(null)

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

  const handleViewReceipt = async () => {
    setReceiptData({
      receiptId: selectedPayment?.receiptCode || "N/A",
      studentName: selectedPayment?.userName || "N/A",
      studentId: selectedPayment?.studentId || "N/A",
      items: selectedPayment?.metadata.items?.map(d => ({ name: d.title, type: d.paymentType as "fees" | "fines", amount: d.amount })) ?? [],
      total: selectedPayment?.amount || 0,
      date: selectedPayment?.verifiedAt!.toDate().toLocaleString() || "N/A",
      verifiedByName: selectedPayment?.verifiedByName || "N/A",
      paymentMethod: selectedPayment?.paymentMethod || "Cash",
      AY: selected!.AY,
      semester:selected!.semester,
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
        context={`${sem} Semester · A.Y. ${AY}`}
        description="Review and manage student payment submissions"
        action={
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-2.5 shadow-xs">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">
                  Portal Payments
                </span>
                <Badge
                  variant={isAcceptingPayments === true ? "default" : "secondary"}
                  className={
                    isLoadingPaymentAcceptance
                      ? "h-5 px-2 text-[10px] font-bold uppercase"
                      : isAcceptingPayments === true
                        ? "h-5 px-2 text-[10px] font-bold uppercase"
                        : isAcceptingPayments === false
                          ? "h-5 border-amber-300 bg-amber-100 px-2 text-[10px] font-bold uppercase text-amber-800 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                          : "h-5 border-destructive/30 bg-destructive/10 px-2 text-[10px] font-bold uppercase text-destructive"
                  }
                >
                  {isLoadingPaymentAcceptance
                    ? "Loading…"
                    : isAcceptingPayments === true
                      ? "Accepting"
                      : isAcceptingPayments === false
                        ? "Paused"
                        : "Unavailable"}
                </Badge>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {isLoadingPaymentAcceptance
                  ? "Checking portal payment status…"
                  : isAcceptingPayments === true
                    ? "Students can submit online payments"
                    : isAcceptingPayments === false
                      ? "Online submissions are disabled"
                      : "Could not load portal payment status"}
              </span>
            </div>
            {isUpdatingPaymentAcceptance || isLoadingPaymentAcceptance ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Switch
                checked={isAcceptingPayments === true}
                disabled={isLoadingPaymentAcceptance || isUpdatingPaymentAcceptance || isAcceptingPayments === null}
                onCheckedChange={(checked) => {
                  setPendingToggleValue(checked)
                  setConfirmToggleOpen(true)
                }}
                aria-label="Toggle student portal payments"
              />
            )}
          </div>
        }
      />

      {!isLoadingPaymentAcceptance && isAcceptingPayments === false && (
        <Alert className="border-amber-300 bg-amber-50/90 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="font-bold text-amber-900 dark:text-amber-200">
            Student Portal Payments Temporarily Disabled
          </AlertTitle>
          <AlertDescription className="text-amber-800 dark:text-amber-300/90">
            Students can still view their outstanding balances on the student portal, but new online payment submissions are paused for your organization. You can still review existing submissions and log manual payments below.
          </AlertDescription>
        </Alert>
      )}

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
        description={selectedPayment?.status === "verified" ? "Reviewing Payment" : "Review the payment details and approve or reject the submission."  }
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

      {/* ── Confirm Portal Payments Toggle Dialog ── */}
      <AlertDialog
        open={confirmToggleOpen}
        onOpenChange={(open) => {
          setConfirmToggleOpen(open)
          if (!open) setPendingToggleValue(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingToggleValue
                ? "Enable Student Portal Payments?"
                : "Temporarily Disable Student Portal Payments?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingToggleValue
                ? "Students will be able to select your organization on the student portal and submit online payment proofs again."
                : "Students will still see their outstanding balance for your organization on the student portal, but they will not be able to select your organization or submit new online payments until you re-enable this setting."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingPaymentAcceptance}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isUpdatingPaymentAcceptance}
              className={
                pendingToggleValue === false
                  ? "bg-destructive text-white hover:bg-destructive/90"
                  : undefined
              }
              onClick={async () => {
                if (pendingToggleValue !== null) {
                  await handleTogglePaymentAcceptance(pendingToggleValue)
                }
                setConfirmToggleOpen(false)
                setPendingToggleValue(null)
              }}
            >
              {pendingToggleValue ? "Enable Payments" : "Disable Payments"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}