// app/admin/fees/roster/components/FeesRosterContent.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Archive, ArrowLeft, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataPagination } from "@/components/organization/DataPagination";
// import { StatCards } from "@/features/organization/fees/components/StatCards";
import { StatCards } from "../local-components/StatCards";
import { SearchFilterBar } from "@/features/organization/fees/components/SearchFilterBar";
import { ViewToggle } from "@/components/organization/ViewToggle";
import { SubmissionsView } from "@/features/organization/fees/components/SubmissionView";
import { AllStudentsView } from "@/features/organization/fees/components/AllStudentsView";
import { ManualPaymentDialog } from "@/features/organization/fees/components/ManualPaymentDialog";
import { PaymentDetailDialog } from "@/features/organization/fees/components/PaymentDetailDialog";
import { RejectDialog } from "@/features/organization/fees/components/RejectDialog";
import type { Fee, PaymentLog } from "@/features/organization/fees/types";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../local-components/alert-dialog";

import { StudentFeeRow } from "../hooks/useFeesRoster";
import { useFeesRosterUI } from "../hooks/useFeesRosterUI";
// import { PaymentReviewDialog } from "@/components/organization/PaymentReviewDialog";
import { PaymentReviewDialog } from "../local-components/PaymentReviewDialog";
const ITEMS_PER_PAGE = 10;

export function FeesRosterContent({
  fee,
  studentRows,
  onApprovePayment,
  onRejectPayment,
  onManualPaymentAdded,
  onArchiveFee,
  isSubmitting = false,
}: {
  fee: Fee;
  studentRows: StudentFeeRow[];
  onApprovePayment: (proofId: string) => Promise<void>;
  onRejectPayment: (proofId: string, reason: string) => Promise<void>;
  onManualPaymentAdded: (feeId: string, amount: string, method: "gcash" | "cash" | "bank_transfer" | "waiver", ref?: string) => Promise<void>;
  onArchiveFee: (feeTitle: string, academicYear: string, semester: string) => Promise<void>;
  isSubmitting?: boolean;
}) {
  const router = useRouter();
  const { state, computed, actions } = useFeesRosterUI({
    fee,
    router,
    studentRows,
    onApprovePayment,
    onRejectPayment,
    onManualPaymentAdded,
    onArchiveFee,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  const {
    archiveDialogOpen,
    search,
    filterStatus,
    viewMode,
    dataView,
    currentPage,
    selectedLog,
    detailOpen,
    rejectOpen,
    rejectionReason,
    manualLogOpen,
    studentRowFee,
    isArchiving: isStateArchiving,
  } = state;

  // Use the prop isSubmitting if provided, otherwise fallback to local isArchiving state
  const isCurrentlyArchiving = isSubmitting || isStateArchiving;

  const {
    paginatedLogs,
    paginatedRows,
    totalPages,
    stats,
    filteredLogsCount,
    filteredRowsCount,
  } = computed;

  const {
    setArchiveDialogOpen,
    setSearch,
    setFilterStatus,
    setViewMode,
    setDataView,
    setCurrentPage,
    setDetailOpen,
    setRejectOpen,
    setRejectionReason,
    setManualLogOpen,
    handleApprove,
    handleReject,
    handleAddManualLog,
    handleViewDetails,
    handleManualLogRequest,
    setStudentRowFee,
    handleArchiveConfirm
  } = actions;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit -ml-2 text-muted-foreground hover:text-foreground"
          onClick={() => router.back()}
        >
          <ArrowLeft className="size-4 mr-1" /> Back
        </Button>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{fee.title}</h1>
            <p className="text-sm text-muted-foreground">
              Fees Roster · {fee.semester ? fee.semester + " Semester" : ""} {fee.academicYear ? " - " + fee.academicYear + " A.Y." : ""} · ₱{(fee.amount || 0).toLocaleString()}
            </p>
          </div>
          
          <Button
            variant="outline"
            size="default"
            className="gap-2 text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/10 w-full sm:w-auto"
            onClick={() => setArchiveDialogOpen(true)}
          >
            <Archive className="size-4" />
            Archive Fee
          </Button>
        </div>
      </div>
      
      <StatCards stats={stats} />

      <Card className="border-border">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-3">
              <div>
                <CardTitle className="text-base text-foreground">Fee Payment Status</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Track and manage payments for this fee
                </CardDescription>
              </div>
              <Tabs
                value={dataView}
                onValueChange={setDataView}
              >
                <TabsList>
                  <TabsTrigger value="submissions">Submissions</TabsTrigger>
                  <TabsTrigger value="all-students">All Students</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SearchFilterBar
                search={search}
                onSearchChange={setSearch}
                filterStatus={filterStatus}
                onFilterChange={setFilterStatus}
                showUnpaidFilter={dataView === "all-students"}
              />
              <ViewToggle viewMode={viewMode} onViewChange={() => setViewMode(viewMode === "card" ? "table" : "card")} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {dataView === "submissions" ? (
            <SubmissionsView
              logs={paginatedLogs}
              viewMode={viewMode}
              onViewDetails={handleViewDetails}
            />
          ) : (
            <AllStudentsView
              rows={paginatedRows as any} 
              viewMode={viewMode}
              onViewDetails={handleViewDetails}
              onManualLog={(student) => handleManualLogRequest(student.id || "")}
            />
          )}
          <DataPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={dataView === "submissions" ? filteredLogsCount : filteredRowsCount}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 text-destructive mb-2">
              <div className="p-2 rounded-full bg-destructive/10">
                <AlertTriangle className="size-5" />
              </div>
              <AlertDialogTitle className="text-destructive">Archive Fee</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Are you sure you want to archive <span className="font-semibold text-[#3b413a]">"{fee.title}"</span>?
            </AlertDialogDescription>
            
            <div className="text-[#103712] bg-[#103712]/10 p-3 rounded-md space-y-1 text-sm my-2 text-left">
              <div><span className="font-medium !text-[#103712]">Semester:</span> {fee.semester || 'N/A'}</div>
              <div><span className="font-medium !text-[#103712]">Academic Year:</span> {fee.academicYear || 'N/A'}</div>
              <div><span className="font-medium !text-[#103712]">Amount:</span> ₱{(fee.amount || 0).toLocaleString()}</div>
            </div>
            
            <p className="text-[#103712] text-sm text-left">
              This fee will be moved to archives and will no longer be active. Students will not be able to make new payments for this fee.
            </p>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isCurrentlyArchiving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleArchiveConfirm();
              }}
              disabled={isCurrentlyArchiving}
              className="gap-2 bg-destructive hover:bg-destructive/90"
            >
              {isCurrentlyArchiving && <Loader className="size-4 animate-spin" />}
              {isCurrentlyArchiving ? 'Archiving...' : 'Archive Fee'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ManualPaymentDialog
        fee={fee}
        student={studentRowFee || null}
        open={manualLogOpen}
        onOpenChange={(open) => {
          setManualLogOpen(open);
          if (!open) setStudentRowFee(null);
        }}
        onSuccess={handleAddManualLog}
      />

      <PaymentReviewDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        title={selectedLog?.status === "pending" ? "Review Payment" : "Payment Details"}
        description={selectedLog?.status === "pending" ? "Review the payment details and approve or reject the payment." : "View the payment details."}
        data={{
          studentId: (selectedLog as any)?.studentId || "",
          studentName: (selectedLog as any)?.studentName || "",
          amountPaid: (selectedLog)?.amount || 0,
          paymentMethod: (selectedLog)?.paymentMethod || "",
          submittedAt: selectedLog?.paidAt ? (selectedLog as any)!.paidAt.toDate().toISOString().slice(0, 10) : "",
          receiptContent: (selectedLog as any)?.imageUrl || "",
          referenceNo: selectedLog?.gcashReference || "",
          typeLabel: (selectedLog as any)?.type || "",
        }}
        onApprove={selectedLog?.status === "pending" ? () => handleApprove(selectedLog!.paymentProofId!) : undefined}
        onReject={async (reason) => {
        if (selectedLog?.status === "pending" ) handleReject(selectedLog!.paymentProofId!, reason);
        }}
        isProcessing={isSubmitting}
      />

    </div>
  );
}