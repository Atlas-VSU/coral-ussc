import { useState, useMemo } from "react";
import type { Fee, PaymentLog } from "../types";
import type { StudentFeeRow } from "./useFeesRoster";
import { useRouter } from "next/navigation";

interface UseFeesRosterUIProps {
  fee: Fee;
  router: ReturnType<typeof useRouter>;
  studentRows: StudentFeeRow[];
  onApprovePayment: (proofId: string) => Promise<void>;
  onRejectPayment: (proofId: string ,reason: string) => Promise<void>;
  onManualPaymentAdded: (
    feeId: string,
    amount: string,
    method: "gcash" | "cash" | "bank_transfer" | "waiver",
    ref?: string,
    senderNumber?: string
  ) => Promise<void>;
  onArchiveFee: (feeTitle: string, academicYear: string, semester: string) => Promise<void>;
  itemsPerPage?: number;
}

export function useFeesRosterUI({
  fee,
  router,
  studentRows,
  onApprovePayment,
  onRejectPayment,
  onManualPaymentAdded,
  onArchiveFee,
  itemsPerPage = 10,
}: UseFeesRosterUIProps) {
  const allLogs = useMemo(() => studentRows.flatMap((row) => row.logs), [studentRows]);

  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
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
  const [studentRowFee, setStudentRowFee] = useState<StudentFeeRow | null>(null);

  const allStudentRows = useMemo(() => {
    return studentRows
      .map((s) => {
        const latestLog = s.logs.length > 0 ? s.logs[s.logs.length - 1] : null;
        return {
          student: s.memberInfo,
          log: latestLog,
          status: s.status || "unpaid",
          updatedAt: s.updatedAt,
        };
      })
      .sort((a, b) => b.updatedAt?.toMillis() - a.updatedAt?.toMillis());
  }, [studentRows]);

  const filteredLogs = useMemo(() => {
    return allLogs.filter((l: any) => {
      const matchesSearch =
        (l.studentName || "").toLowerCase().includes(search.toLowerCase()) ||
        (l.studentName || "").toLowerCase().includes(search.toLowerCase()) ||
        (l.studentName || "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filterStatus === "all" || l.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [allLogs, filterStatus, search]);

  const filteredRows = useMemo(() => {
    return allStudentRows.filter((r) => {
      const matchesSearch =
        (r.student.firstName || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.student.lastName || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.student.studentId || "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filterStatus === "all" || (r.log?.status === filterStatus || r.status === filterStatus);
      return matchesSearch && matchesStatus;
    });
  }, [allStudentRows, search, filterStatus]);

  const totalPages = Math.ceil(
    (dataView === "submissions" ? filteredLogs.length : filteredRows.length) / itemsPerPage
  );

  const paginatedLogs = useMemo(
    () => filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()),
    [filteredLogs, currentPage, itemsPerPage]
  );

  const paginatedRows = useMemo(
    () => filteredRows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).sort((a, b) => b.updatedAt?.toMillis() || 0 - (a.updatedAt?.toMillis() || 0)),
    [filteredRows, currentPage, itemsPerPage]
  );

  const stats = useMemo(() => ({
    pending: allLogs.filter((l) => l.status === "pending").length,
    verified: allLogs.filter((l) => l.status === "verified").length,
    rejected: allLogs.filter((l) => l.status === "rejected").length,
    unpaid: allStudentRows.filter((r) => r.status === "unpaid").length,
  }), [allLogs, allStudentRows]);

  const handleApprove = async (proofId: string) => {
    await onApprovePayment(proofId);
    setDetailOpen(false);
    setSelectedLog(null);
  };

  const handleReject = async (proofId: string, reason: string) => {
    if (!reason.trim()) return;
    await onRejectPayment(proofId, reason);
    setRejectOpen(false);
    setDetailOpen(false);
    setSelectedLog(null);
    setRejectionReason("");
  };

  const handleAddManualLog = async (
    feeId: string,
    amount: string,
    method: "gcash" | "cash" | "bank_transfer" | "waiver",
    ref?: string,
    senderNumber?: string
  ) => {
    await onManualPaymentAdded(feeId, amount, method, ref, senderNumber);
    setManualLogOpen(false);
  };

  const handleViewDetails = (log: PaymentLog) => {
    setSelectedLog(log);
    setDetailOpen(true);
  };

  const handleManualLogRequest = (studentId: string) => {
    const matchedRow = studentRows.find((row) => row.memberInfo.id === studentId);
    setStudentRowFee(matchedRow || null);
    setManualLogOpen(true);
  };

  const handleDataViewChange = (v: string): void => {
    setDataView(v as typeof dataView);
    setFilterStatus("all");
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handleStatusChange = (val: string) => {
    setFilterStatus(val);
    setCurrentPage(1);
  };

  const handleArchiveConfirm = async () => {
    try {
      setIsArchiving(true);
      await onArchiveFee(fee.title, fee.academicYear, fee.semester!);
      console.log("archive");
      router.back(); 
    } catch (error) {
      console.error('Failed to archive fee:', error);
    } finally {
      setIsArchiving(false);
      setArchiveDialogOpen(false);
    }
  };

  return {
    state: {
      archiveDialogOpen,
      isArchiving,
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
    },
    computed: {
      paginatedLogs,
      paginatedRows,
      totalPages,
      stats,
      filteredLogsCount: filteredLogs.length,
      filteredRowsCount: filteredRows.length,
    },
    actions: {
      setArchiveDialogOpen,
      setIsArchiving,
      handleArchiveConfirm,
      setSearch: handleSearchChange,
      setFilterStatus: handleStatusChange,
      setViewMode,
      setDataView: handleDataViewChange,
      setCurrentPage,
      setDetailOpen,
      setRejectOpen,
      setRejectionReason,
      setManualLogOpen,
      setStudentRowFee,
      handleApprove,
      handleReject,
      handleAddManualLog,
      handleViewDetails,
      handleManualLogRequest,
    },
  };
}
