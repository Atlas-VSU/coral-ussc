// app/admin/fees/roster/components/FeesRosterContent.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Archive, ArrowLeft, CheckCircle, Loader, Clock, MinusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataPagination } from "@/components/organization/general/DataPagination";
import { FeesRosterFilters } from "./FeesRosterFilters";
import { TableSkeleton } from "@/components/organization/skeleton/TableSkeleton";
import { CardGridSkeleton } from "@/components/organization/skeleton/CardGridSkeleton";
import { SubmissionsView } from "@/features/organization/fees/components/SubmissionView";
import { AllStudentsView } from "@/features/organization/fees-roster/components/AllStudentsView";
import { ManualPaymentDialog } from "@/features/organization/fees/components/ManualPaymentDialog";
import { PaymentDetailDialog } from "@/features/organization/fees-roster/components/PaymentDetailDialog";
import { RejectDialog } from "@/features/organization/fees-roster/components/RejectDialog";
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
} from "@/components/ui/alert-dialog";

import { StudentFeeRow } from "../hooks/useFeesRoster";
import { useFeesRosterUI } from "../hooks/useFeesRosterUI";
import { PaymentReviewDialog } from "@/components/organization/receipt/PaymentReviewDialog";
import { StatCard } from "@/components/organization/general/StatCard";
import { StatCardsCarousel } from "@/components/organization/general/StatCardsCarousel";
const ITEMS_PER_PAGE = 9;

export function FeesRosterContent({
  fee,
  studentRows,
  logs,
  onApprovePayment,
  onRejectPayment,
  onManualPaymentAdded,
  onArchiveFee,
  isSubmitting = false,
  refetchStudentRow,
  isLoading = false,
  refetch,
  // Lifted State
  currentPage,
  setCurrentPage,
  search,
  searchTerm,
  setSearchTerm,
  handleSearchCommit,
  handleSearchClear,
  handleRefresh,
  setSearch,
  filterStatus,
  setFilterStatus,
  dataView,
  setDataView,
  totalCount,
  stats,
  hasNextPage,
}: {
  fee: Fee;
  studentRows: StudentFeeRow[];
  logs: PaymentLog[];
  onApprovePayment: (proofId: string) => Promise<void>;
  onRejectPayment: (proofId: string, reason: string) => Promise<void>;
  onManualPaymentAdded: (
    feeId: string,
    amount: string,
    method: "gcash" | "cash" | "bank_transfer" | "waiver",
    ref?: string,
  ) => Promise<void>;
  onArchiveFee: (feeItemId: string) => Promise<void>;
  isSubmitting?: boolean;
  refetchStudentRow: (feeId: string) => Promise<void>;
  isLoading?: boolean;
  refetch: () => Promise<void>;
  // Lifted State Types
  currentPage: number;
  setCurrentPage: (page: number) => void;
  search: string;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  handleSearchCommit: () => void;
  handleSearchClear: () => void;
  handleRefresh: () => void;
  setSearch: (s: string) => void;
  filterStatus: string;
  setFilterStatus: (s: string) => void;
  dataView: "submissions" | "all-students";
  setDataView: (v: "submissions" | "all-students") => void;
  totalCount: number;
  stats: {
    pending: number;
    verified: number;
    rejected: number;
    unpaid: number;
  };
  hasNextPage: boolean;
}) {
  const router = useRouter();
  const { state, computed, actions } = useFeesRosterUI({
    fee,
    router,
    studentRows,
    logs,
    onApprovePayment,
    onRejectPayment,
    onManualPaymentAdded,
    onArchiveFee,
    itemsPerPage: ITEMS_PER_PAGE,
    isLoading,
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    currentPage,
    setCurrentPage,
    dataView,
    setDataView,
  });

  const {
    archiveDialogOpen,
    viewMode,
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

  const { paginatedLogs, paginatedRows } = computed;


  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const {
    setArchiveDialogOpen,
    setViewMode,
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
    handleArchiveConfirm,
    // Use the actions from UI hook as they may contain logic (like resetting page)
    setSearch: handleSearch,
    setFilterStatus: handleFilterStatus,
    setDataView: handleDataView,
    setCurrentPage: handlePageChange,
  } = actions;

  return (
    <div className="flex flex-col gap-6 pb-5 lg:pb-0">
      {/* Header Card with Green Gradient */}
      <div
        className="rounded-xl px-4 sm:px-6 py-4 sm:py-6"
        style={{
          background:
            "linear-gradient(135deg, #ffffff 10%, #EAF3DE 100%, #C0DD97 100%)",
          boxShadow: "0 4px 24px 0 rgba(5,140,17,0.08)",
        }}
      >
        <div className="flex flex-col gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-fit -ml-2 hover:bg-white/50 transition-colors"
            style={{ color: "#058C11" }}
            onClick={() => router.back()}
          >
            <ArrowLeft className="size-4 mr-1" /> Back
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <h1 
                className="text-2xl font-bold tracking-tight font-nunito mb-1"
                style={{ color: "#27500A" }}
              >
                {fee.title}
              </h1>
              <p 
                className="text-sm font-nunito-sans"
                style={{ color: "#3B6D11" }}
              >
                Fees Roster · {fee.semester ? fee.semester + " Semester" : ""}{" "}
                {fee.academicYear ? " - " + fee.academicYear + " A.Y." : ""} · ₱
                {(fee.amount || 0).toLocaleString()}
              </p>
            </div>

            <Button
              variant="destructive"
              size="default"
              onClick={() => setArchiveDialogOpen(true)}
              className="shrink-0"
            >
              <Archive className="size-4 mr-2" />
              Archive Fee
            </Button>
          </div>

          {/* Decorative Separator */}
          <div
            className="h-px w-full my-2"
            style={{
              background:
                "linear-gradient(to right, transparent, #97C459, transparent)",
            }}
          />

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <div
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ background: "#ffffff" }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "#FEF9E6" }}
              >
                <Clock className="h-5 w-5" style={{ color: "#D9A200" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p 
                  className="text-xs font-medium uppercase tracking-wider mb-0.5 font-nunito-sans"
                  style={{ color: "#3B6D11" }}
                >
                  Pending
                </p>
                <p 
                  className="text-lg font-bold font-nunito"
                  style={{ color: "#27500A" }}
                >
                  {stats.pending?.toLocaleString()}
                </p>
              </div>
            </div>

            <div
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ background: "#ffffff" }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "#E8F5E9" }}
              >
                <CheckCircle className="h-5 w-5" style={{ color: "#058C11" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p 
                  className="text-xs font-medium uppercase tracking-wider mb-0.5 font-nunito-sans"
                  style={{ color: "#3B6D11" }}
                >
                  Verified
                </p>
                <p 
                  className="text-lg font-bold font-nunito"
                  style={{ color: "#27500A" }}
                >
                  {stats.verified?.toLocaleString()}
                </p>
              </div>
            </div>

            <div
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ background: "#ffffff" }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "#FEF3F2" }}
              >
                <MinusCircle className="h-5 w-5" style={{ color: "#DC2626" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p 
                  className="text-xs font-medium uppercase tracking-wider mb-0.5 font-nunito-sans"
                  style={{ color: "#3B6D11" }}
                >
                  Unpaid
                </p>
                <p 
                  className="text-lg font-bold font-nunito"
                  style={{ color: "#27500A" }}
                >
                  {stats.unpaid?.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters (Outside Card) ── */}
      <FeesRosterFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearchCommit={handleSearchCommit}
        onSearchClear={handleSearchClear}
        filterStatus={filterStatus}
        onFilterChange={(v) => {
          handleFilterStatus(v);
          handlePageChange(1);
        }}
        showUnpaidFilter={dataView === "all-students"}
        onRefresh={handleRefresh}
        disabled={isLoading}
        viewMode={viewMode}
        onViewChange={() => setViewMode(viewMode === "card" ? "table" : "card")}
      />

      <div
        className="rounded-xl px-4 sm:px-6 py-4 sm:py-6"
        style={{
          background:
            "linear-gradient(135deg, #ffffff 10%, #EAF3DE 100%, #C0DD97 100%)",
          boxShadow: "0 4px 24px 0 rgba(5,140,17,0.08)",
        }}
      >
        <div className="pb-4">
          <Tabs
            value={dataView}
            onValueChange={(v) => handleDataView(v as any)}
          >
            <TabsList 
              className="grid w-full grid-cols-2 max-[510px]:h-auto max-[510px]:grid-cols-1 bg-white/50 border"
              style={{ borderColor: "#97C459" }}
            >
              <TabsTrigger 
                value="submissions" 
                className="w-full max-[510px]:justify-center data-[state=active]:bg-white data-[state=active]:text-[#058C11] data-[state=active]:font-semibold"
              >
                Payment Submissions
              </TabsTrigger>
              <TabsTrigger 
                value="all-students" 
                className="w-full max-[510px]:justify-center data-[state=active]:bg-white data-[state=active]:text-[#058C11] data-[state=active]:font-semibold"
              >
                All Students
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="bg-white rounded-lg p-4">
          {isLoading ? (
            viewMode === "table" ? (
              <TableSkeleton columns={6} rows={10} />
            ) : (
              <CardGridSkeleton count={6} />
            )
          ) : dataView === "submissions" ? (
            <SubmissionsView
              logs={paginatedLogs}
              viewMode={viewMode}
              onViewDetails={handleViewDetails}
              filterStatus={filterStatus}
            />
          ) : (
            <AllStudentsView
              rows={paginatedRows.map((row) => ({
                ...row,
                log: row.logs[0],
              }))}
              viewMode={viewMode}
              onViewDetails={handleViewDetails}
              onManualLog={(student) =>
                handleManualLogRequest(student.id || "")
              }
              filterStatus={filterStatus}
            />
          )}
          <DataPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalCount}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
            hasNextPage={hasNextPage}
          />
        </div>
      </div>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 text-destructive mb-2">
              <div className="p-2 rounded-full bg-destructive/10">
                <AlertTriangle className="size-5" />
              </div>
              <AlertDialogTitle className="text-destructive">
                Archive Fee
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Are you sure you want to archive{" "}
              <span className="font-semibold text-[#3b413a]">
                "{fee.title}"
              </span>
              ?
            </AlertDialogDescription>

            <div className="text-[#103712] bg-[#103712]/10 p-3 rounded-md space-y-1 text-sm my-2 text-left">
              <div>
                <span className="font-medium !text-[#103712]">Semester:</span>{" "}
                {fee.semester || "N/A"}
              </div>
              <div>
                <span className="font-medium !text-[#103712]">
                  Academic Year:
                </span>{" "}
                {fee.academicYear || "N/A"}
              </div>
              <div>
                <span className="font-medium !text-[#103712]">Amount:</span> ₱
                {(fee.amount || 0).toLocaleString()}
              </div>
            </div>

            <p className="text-[#103712] text-sm text-left">
              This fee will be moved to archives and will no longer be active.
              Students will not be able to make new payments for this fee.
            </p>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isCurrentlyArchiving}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleArchiveConfirm();
              }}
              disabled={isCurrentlyArchiving}
              className="gap-2 bg-destructive hover:bg-destructive/90"
            >
              {isCurrentlyArchiving && (
                <Loader className="size-4 animate-spin" />
              )}
              {isCurrentlyArchiving ? "Archiving..." : "Archive Fee"}
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
        title={
          selectedLog?.status === "pending"
            ? "Review Payment"
            : "Payment Details"
        }
        description={
          selectedLog?.status === "pending"
            ? "Review the payment details and approve or reject the payment."
            : "View the payment details."
        }
        data={{
          studentId: (selectedLog as any)?.studentId || "",
          studentName: (selectedLog as any)?.studentName || "",
          amountPaid: selectedLog?.amount || 0,
          paymentMethod: selectedLog?.paymentMethod || "Cash",
          submittedAt: selectedLog?.paidAt
            ? (selectedLog as any)!.paidAt
                .toDate()
                .toLocaleString()
            : "",
          receiptContent: (selectedLog as any)?.receiptContent || "",
          referenceNo: selectedLog?.gcashReference || "",
          typeLabel: (selectedLog as any)?.type || "",
          reviewedBy: (selectedLog as any)?.reviewedBy || "",
          notes:
            (selectedLog as any)?.notes ||
            (selectedLog as any)?.metadata?.notes ||
            "",
          declineRemarks: (selectedLog as any)?.declineRemarks || "",
        }}
        onApprove={
          selectedLog?.status === "pending"
            ? async () => await handleApprove(selectedLog!.paymentProofId!)
            : undefined
        }
        onReject={async (reason) => {
          if (selectedLog?.status === "pending")
            await handleReject(selectedLog!.paymentProofId!, reason);
        }}
        isProcessing={isSubmitting}
      />
    </div>
  );
}
