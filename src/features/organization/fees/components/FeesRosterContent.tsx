// app/admin/fees/roster/components/FeesRosterContent.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataPagination } from "@/components/organization/DataPagination";
import { StatCards } from "@/features/organization/fees/components/StatCards";
import { SearchFilterBar } from "@/features/organization/fees/components/SearchFilterBar";
import { ViewToggle } from "@/components/organization/ViewToggle";
import { SubmissionsView } from "@/features/organization/fees/components/SubmissionView";
import { AllStudentsView } from "@/features/organization/fees/components/AllStudentsView";
import { ManualPaymentDialog } from "@/features/organization/fees/components/ManualPaymentDialog";
import { PaymentDetailDialog } from "@/features/organization/fees/components/PaymentDetailDialog";
import { RejectDialog } from "@/features/organization/fees/components/RejectDialog";
import type { Fee, PaymentLog } from "@/features/organization/fees/types";
import { StudentFeeRow } from "../hooks/useFeesRoster";
import { useFeesRosterUI } from "../hooks/useFeesRosterUI";

const ITEMS_PER_PAGE = 10;

export function FeesRosterContent({
  fee,
  studentRows,
  onApprovePayment,
  onRejectPayment,
  onManualPaymentAdded
}: {
  fee: Fee;
  studentRows: StudentFeeRow[];
  onApprovePayment: (proofId: string) => Promise<void>;
  onRejectPayment: (proofId: string, reason: string) => Promise<void>;
  onManualPaymentAdded: (feeId: string, amount: string, method: "gcash" | "cash" | "bank_transfer" | "waiver", ref?: string) => Promise<void>;
}) {
  const router = useRouter();
  const { state, computed, actions } = useFeesRosterUI({
    fee,
    studentRows,
    onApprovePayment,
    onRejectPayment,
    onManualPaymentAdded,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  const {
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
  } = state;

  const {
    paginatedLogs,
    paginatedRows,
    totalPages,
    stats,
    filteredLogsCount,
    filteredRowsCount,
  } = computed;

  const {
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
  } = actions;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit -ml-2 text-muted-foreground"
          onClick={() => router.back()}
        >
          <ArrowLeft className="size-4 mr-1" /> Back
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{fee.title}</h1>
        <p className="text-sm text-muted-foreground">
          Fees Roster · {fee.semester ? fee.semester + " Semester" : ""} {fee.academicYear ? " - " + fee.academicYear + " A.Y." : ""} · ₱{(fee.amount || 0).toLocaleString()}
        </p>
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
      <PaymentDetailDialog
        feeId={fee.id!}
        log={selectedLog}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onApprove={() => handleApprove(selectedLog!.paymentProofId!)}
        onReject={() => {
          setDetailOpen(false);
          setRejectOpen(true);
        }}
      />
      <RejectDialog
        log={selectedLog}
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        rejectionReason={rejectionReason}
        onReasonChange={setRejectionReason}
        onConfirm={() => handleReject(selectedLog!.paymentProofId!)}
      />
    </div>
  );
}