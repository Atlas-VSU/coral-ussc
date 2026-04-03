"use client";

import { useState, useEffect } from "react";
import { useFeesRoster } from "../hooks/useFeesRoster";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { FeesRosterContent } from "./FeesRosterContent";
import { useFeeAction } from "../hooks/useFeeAction";
import PaymentReceiptDialog from "@/components/organization/receipt/PaymentReceiptDialog";

const ITEMS_PER_PAGE = 9;

interface FeesRosterPageProps {
  feeItemId: string
}

export default function FeesRosterPage({
  feeItemId
}: FeesRosterPageProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
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
    stats,
    hasNextPage,
  } = useFeesRoster(feeItemId, {
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

  // Sync searchTerm with search
  useEffect(() => {
    setSearchTerm(search);
  }, [search]);

  const handleSearchCommit = () => {
    setSearch(searchTerm);
    setCurrentPage(1);
  };

  const handleSearchClear = () => {
    setSearchTerm("");
    setSearch("");
    setCurrentPage(1);
  };

  const handleRefresh = async () => {
    handleSearchClear();
    setFilterStatus("all");
    setCurrentPage(1);
    refetch();
  };

  if (isLoading && !fee) {
    return (
      <div className="flex flex-col gap-6 pb-5 lg:pb-0">
        <div
          className="rounded-xl px-4 sm:px-6 py-4 sm:py-6 animate-pulse"
          style={{
            background:
              "linear-gradient(135deg, #ffffff 10%, #EAF3DE 100%, #C0DD97 100%)",
            boxShadow: "0 4px 24px 0 rgba(5,140,17,0.08)",
          }}
        >
          <div className="flex flex-col gap-4">
            <Skeleton className="h-8 w-16 bg-white/50" />
            <Skeleton className="h-8 w-64 bg-white/50" />
            <Skeleton className="h-4 w-96 bg-white/50" />
            <div
              className="h-px w-full my-2 bg-white/50"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full bg-white" />
              ))}
            </div>
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !fee) {
    return (
      <div className="flex flex-col gap-6 pb-5 lg:pb-0">
        <div
          className="rounded-xl px-4 sm:px-6 py-4 sm:py-6"
          style={{
            background:
              "linear-gradient(135deg, #ffffff 10%, #EAF3DE 100%, #C0DD97 100%)",
            boxShadow: "0 4px 24px 0 rgba(5,140,17,0.08)",
          }}
        >
          <Alert variant="destructive" className="bg-white border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error?.message || "Fee not found. Please check the title and academic year."}
            </AlertDescription>
          </Alert>
        </div>
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
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        handleSearchCommit={handleSearchCommit}
        handleSearchClear={handleSearchClear}
        handleRefresh={handleRefresh}
        setSearch={setSearch}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        dataView={dataView}
        setDataView={setDataView}
        totalCount={totalCount}
        stats={stats}
        hasNextPage={hasNextPage}
      />
    </>
  );
}