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
  onApprovePayment: (logId: string) => Promise<void>;
  onRejectPayment: (logId: string, reason: string) => Promise<void>;
  onManualPaymentAdded: (feeId: string, amount: string, method: "gcash" | "cash" | "bank_transfer" | "waiver", ref?: string) => Promise<void>;
}) {
  const router = useRouter();
  console.log(studentRows, "studentRows");
  const allLogs = useMemo(() => studentRows.flatMap(row => row.logs), [studentRows]);
  console.log(allLogs, "logsz");

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const [dataView, setDataView] = useState<"submissions" | "all-students">("submissions");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedLog, setSelectedLog] = useState<PaymentLog | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [manualLogOpen, setManualLogOpen] = useState(false);
  
  // Using this single state to track the active row for manual payments
  const [studentRowFee, setStudentRowFee] = useState<StudentFeeRow | null>(null);

  const allStudentRows = useMemo(() => {
    return studentRows.map((s) => {
      const latestLog = s.logs.length > 0 ? s.logs[s.logs.length - 1] : null;
      return {
        student: s.memberInfo,
        log: latestLog,
        status: s.status || "unpaid", 
      };
    });
  }, [studentRows]);

  // Filtered data
  const filteredLogs = useMemo(() => {
    return allLogs.filter((l) => filterStatus === "all" || l.status === filterStatus);
  }, [allLogs, filterStatus]);

  const filteredRows = useMemo(() => {
    return allStudentRows.filter((r) => {
      const matchesSearch =
        r.student.firstName!.toLowerCase().includes(search.toLowerCase()) ||
        r.student.lastName!.toLowerCase().includes(search.toLowerCase()) ||
        (r.student.studentId || "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filterStatus === "all" || r.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [allStudentRows, search, filterStatus]);

  // Pagination
  const totalPages = Math.ceil(
    (dataView === "submissions" ? filteredLogs.length : filteredRows.length) / ITEMS_PER_PAGE
  );
  const paginatedLogs = useMemo(
    () => filteredLogs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [filteredLogs, currentPage]
  );
  const paginatedRows = useMemo(
    () => filteredRows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [filteredRows, currentPage]
  );

  // Stats
  const stats = {
    pending: allLogs.filter((l) => l.status === "pending_verification").length,
    verified: allLogs.filter((l) => l.status === "verified").length,
    rejected: allLogs.filter((l) => l.status === "rejected").length,
    unpaid: allStudentRows.filter((r) => r.status === "unpaid").length,
  };

  const handleApprove = async (id: string) => {
    await onApprovePayment(id);
    setDetailOpen(false);
    setSelectedLog(null);
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) return;
    await onRejectPayment(id, rejectionReason);
    setRejectOpen(false);
    setDetailOpen(false);
    setSelectedLog(null);
    setRejectionReason("");
  };

  const addManualLog = async (feeId: string, amount: string, method: "gcash" | "cash" | "bank_transfer" | "waiver", ref?: string) => {
    await onManualPaymentAdded(feeId, amount, method, ref);
    setManualLogOpen(false); // Close dialog after successful save
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
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
          Fees Roster · {fee.semester} {fee.academicYear} · ₱{(fee.amount || 0).toLocaleString()}
        </p>
      </div>

      {/* Stats Cards */}
      <StatCards stats={stats} />

      {/* Main Card */}
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
                onValueChange={(v) => {
                  setDataView(v as typeof dataView);
                  setFilterStatus("all");
                  setCurrentPage(1);
                }}
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
                onSearchChange={(val) => {
                  setSearch(val);
                  setCurrentPage(1);
                }}
                filterStatus={filterStatus}
                onFilterChange={(val) => {
                  setFilterStatus(val);
                  setCurrentPage(1);
                }}
                showUnpaidFilter={dataView === "all-students"}
              />
              <ViewToggle viewMode={viewMode} onViewChange={() => setViewMode(v => v === "card" ? "table" : "card")} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {dataView === "submissions" ? (
            <SubmissionsView
              logs={paginatedLogs}
              viewMode={viewMode}
              onViewDetails={(log) => {
                setSelectedLog(log);
                setDetailOpen(true);
              }}
            />
          ) : (
            <AllStudentsView
              rows={paginatedRows as any} 
              viewMode={viewMode}
              onViewDetails={(log) => {
                setSelectedLog(log);
                setDetailOpen(true);
              }}
              onManualLog={(student) => {
                // MATCH THE CLICKED STUDENT TO THEIR FULL DATABASE ROW
                const matchedRow = studentRows.find(row => row.memberInfo.id === student.id);
                setStudentRowFee(matchedRow || null);
                setManualLogOpen(true);
              }}
            />
          )}
          <DataPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={dataView === "submissions" ? filteredLogs.length : filteredRows.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>
        console.log(studentRows)
      {/* Dialogs */}
      <ManualPaymentDialog
        fee={fee}
        student={studentRows.find(row => row.memberInfo.id === studentRowFee?.memberInfo.id) || null} // Typo fixed here
        open={manualLogOpen}
        onOpenChange={(open) => {
          setManualLogOpen(open);
          if (!open) setStudentRowFee(null); // Clear the row data when dialog closes
        }}
        onSuccess={addManualLog}
      />
      <PaymentDetailDialog
        fee={fee}
        log={selectedLog}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onApprove={() => handleApprove(selectedLog!.id)}
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
        onConfirm={() => handleReject(selectedLog!.id)}
      />
    </div>
  );
}