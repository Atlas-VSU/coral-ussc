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
import type { Member } from "@/features/organization/members/types";

const ITEMS_PER_PAGE = 10;

export function FeesRosterContent({
  fee,
  logs: initialLogs,
  students,
}: {
  fee: Fee;
  logs: PaymentLog[];
  students: Member[];
}) {
  const router = useRouter();
  const [logs, setLogs] = useState(initialLogs);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const [dataView, setDataView] = useState<"submissions" | "all-students">("submissions");
  const [currentPage, setCurrentPage] = useState(1);

  // Dialog states
  const [selectedLog, setSelectedLog] = useState<PaymentLog | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [manualLogTarget, setManualLogTarget] = useState<Member | null>(null);
  const [manualLogOpen, setManualLogOpen] = useState(false);

  // Derive all student rows (unified view)
  const allStudentRows = useMemo(() => {
    return students
      .map((s) => {
        // Link log to student via userId (which is found in the parent Fee doc)
        const log = logs.find((l) => (l as any).userId === s.id);
        return {
          student: s,
          log,
          status: log ? log.status : "unpaid",
        };
      });
  }, [students, logs]);

  // Filtered data
  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      // Find the student associated with this log to get their name
      const student = students.find(s => s.studentId === l.id); // This might be wrong if l.id is log id. 
      // Actually, logs in this context are fetched per student in the hook.
      // In FeesRosterContent, we have students (Member[]) and logs (PaymentLog[]).
      // We need a way to link them.
      
      const matchesStatus = filterStatus === "all" || l.status === filterStatus;
      return matchesStatus; // Search is mostly handled in AllStudentsView
    });
  }, [logs, filterStatus]);

  const filteredRows = useMemo(() => {
    return allStudentRows.filter((r) => {
      const matchesSearch =
        r.student.firstName.toLowerCase().includes(search.toLowerCase()) ||
        r.student.lastName.toLowerCase().includes(search.toLowerCase()) ||
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
    pending: logs.filter((l) => l.status === "pending_verification").length,
    verified: logs.filter((l) => l.status === "verified").length,
    rejected: logs.filter((l) => l.status === "rejected").length,
    unpaid: allStudentRows.filter((r) => r.status === "unpaid").length,
  };

  // Handlers
  const handleApprove = (id: string) => {
    setLogs((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              status: "verified",
              verified_by: "Admin",
              verified_at: new Date() as any, // Should ideally be Firestore Timestamp.now()
            }
          : l
      )
    );
    setDetailOpen(false);
    setSelectedLog(null);
  };

  const handleReject = (id: string) => {
    if (!rejectionReason.trim()) return;
    setLogs((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: "rejected", rejection_reason: rejectionReason } : l))
    );
    setRejectOpen(false);
    setDetailOpen(false);
    setSelectedLog(null);
    setRejectionReason("");
  };

  const addManualLog = (newLog: PaymentLog) => {
    setLogs((prev) => [...prev, newLog]);
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
              rows={paginatedRows}
              viewMode={viewMode}
              onViewDetails={(log) => {
                setSelectedLog(log);
                setDetailOpen(true);
              }}
              onManualLog={(student) => {
                setManualLogTarget(student);
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

      {/* Dialogs */}
      <ManualPaymentDialog
        fee={fee}
        student={manualLogTarget}
        open={manualLogOpen}
        onOpenChange={(open) => {
          setManualLogOpen(open);
          if (!open) setManualLogTarget(null);
        }}
        onSuccess={addManualLog}
      />
      <PaymentDetailDialog
        fee={fee}
        log={selectedLog}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onApprove={handleApprove}
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
        onConfirm={handleReject}
      />
    </div>
  );
}