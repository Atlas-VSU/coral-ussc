"use client";

import { useState } from "react";
import { useFeesRoster } from "../hooks/useFeesRoster";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { FeesRosterContent } from "./FeesRosterContent";
import { useFeeAction } from "../hooks/useFeeAction";
import PaymentReceiptDialog from "../local-components/PaymentReceiptDialog";

const ITEMS_PER_PAGE = 10;

interface FeesRosterPageProps {
  title: string;
  academicYear: string;
}

export default function FeesRosterPage({
  title,
  academicYear,
}: FeesRosterPageProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dataView, setDataView] = useState<"submissions" | "all-students">("submissions");

  const {
    fee,
    studentRows,
    logs,
    isLoading,
    error,
    totalCount,
    refetchStudentRow, 
    refetch,
    stats
  } = useFeesRoster(title, academicYear, {
    pageSize: ITEMS_PER_PAGE,
    currentPage,
    search,
    filterStatus,
    dataView,
  });

  const {
    approvePayment,
    rejectPayment,
    addManualPayment,
    receiptData,
    receiptOpen,
    setReceiptOpen,
    archiveFee,
    isSubmitting,
  } = useFeeAction(refetchStudentRow);

  if (isLoading && !fee) {
    return (
      <div className="flex flex-col gap-6 pb-24 lg:pb-0">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !fee) {
    return (
      <div className="flex flex-col gap-6 pb-24 lg:pb-0">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error?.message || "Fee not found. Please check the title and academic year."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      {receiptOpen && (
        <PaymentReceiptDialog
          open={receiptOpen}
          onOpenChange={setReceiptOpen}
          data={receiptData}
        />
      )}

      <FeesRosterContent
        fee={fee as any}
        studentRows={studentRows}
        logs={logs}
        onApprovePayment={approvePayment}
        onManualPaymentAdded={addManualPayment}
        onRejectPayment={rejectPayment}
        onArchiveFee={archiveFee}
        isSubmitting={isSubmitting}
        refetchStudentRow={refetchStudentRow}
        isLoading={isLoading}
        refetch={refetch}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        search={search}
        setSearch={setSearch}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        dataView={dataView}
        setDataView={setDataView}
        totalCount={totalCount} stats={{
          pending: 0,
          verified: 0,
          rejected: 0,
          unpaid: 0
        }}      />
     </>
  );
}