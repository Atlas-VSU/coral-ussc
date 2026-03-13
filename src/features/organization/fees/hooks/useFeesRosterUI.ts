import { useState, useMemo } from "react";
import type { Fee, PaymentLog } from "../types";
import type { StudentFeeRow } from "./useFeesRoster";

interface UseFeesRosterUIProps {
  fee: Fee;
  studentRows: StudentFeeRow[];
  onApprovePayment: (feeId: string, logId: string) => Promise<void>;
  onRejectPayment: (feeId: string, logId: string, reason: string) => Promise<void>;
  onManualPaymentAdded: (
    feeId: string,
    amount: string,
    method: "gcash" | "cash" | "bank_transfer" | "waiver",
    ref?: string
  ) => Promise<void>;
  itemsPerPage?: number;
}

export function useFeesRosterUI({
  fee,
  studentRows,
  onApprovePayment,
  onRejectPayment,
  onManualPaymentAdded,
  itemsPerPage = 10,
}: UseFeesRosterUIProps) {
  const allLogs = useMemo(() => studentRows.flatMap((row) => row.logs), [studentRows]);

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
    return studentRows.map((s) => {
      const latestLog = s.logs.length > 0 ? s.logs[s.logs.length - 1] : null;
      return {
        student: s.memberInfo,
        log: latestLog,
        status: s.status || "unpaid",
      };
    });
  }, [studentRows]);

  const filteredLogs = useMemo(() => {
    return allLogs.filter((l) => filterStatus === "all" || l.status === filterStatus);
  }, [allLogs, filterStatus]);

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
    () => filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filteredLogs, currentPage, itemsPerPage]
  );

  const paginatedRows = useMemo(
    () => filteredRows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filteredRows, currentPage, itemsPerPage]
  );

  const stats = useMemo(() => ({
    pending: allLogs.filter((l) => l.status === "pending_verification").length,
    verified: allLogs.filter((l) => l.status === "verified").length,
    rejected: allLogs.filter((l) => l.status === "rejected").length,
    unpaid: allStudentRows.filter((r) => r.status === "unpaid").length,
  }), [allLogs, allStudentRows]);

  const handleApprove = async (feeId: string, logId: string) => {
    await onApprovePayment(feeId, logId);
    setDetailOpen(false);
    setSelectedLog(null);
  };

  const handleReject = async (feeId: string, logId: string) => {
    if (!rejectionReason.trim()) return;
    await onRejectPayment(feeId, logId, rejectionReason);
    setRejectOpen(false);
    setDetailOpen(false);
    setSelectedLog(null);
    setRejectionReason("");
  };

  const handleAddManualLog = async (
    feeId: string,
    amount: string,
    method: "gcash" | "cash" | "bank_transfer" | "waiver",
    ref?: string
  ) => {
    await onManualPaymentAdded(feeId, amount, method, ref);
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

  return {
    state: {
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
