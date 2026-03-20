import { useState, useMemo } from "react";
import type { Fee, PaymentLog } from "../types";
import type { StudentFeeRow } from "./useFeesRoster";
import { useRouter } from "next/navigation";

interface UseFeesRosterUIProps {
  fee: Fee;
  router: ReturnType<typeof useRouter>;
  studentRows: StudentFeeRow[];
  logs: PaymentLog[];
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
  isLoading?: boolean;
  // External state
  search: string;
  setSearch: (s: string) => void;
  filterStatus: string;
  setFilterStatus: (s: string) => void;
  currentPage: number;
  setCurrentPage: (p: number) => void;
  dataView: "submissions" | "all-students";
  setDataView: (v: "submissions" | "all-students") => void;
}

export function useFeesRosterUI({
  fee,
  router,
  studentRows,
  logs,
  onApprovePayment,
  onRejectPayment,
  onManualPaymentAdded,
  onArchiveFee,
  itemsPerPage = 10,
  isLoading = false,
  search,
  setSearch,
  filterStatus,
  setFilterStatus,
  currentPage,
  setCurrentPage,
  dataView,
  setDataView,
}: UseFeesRosterUIProps) {
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "table">("table");

  const [selectedLog, setSelectedLog] = useState<PaymentLog | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [manualLogOpen, setManualLogOpen] = useState(false);
  const [studentRowFee, setStudentRowFee] = useState<StudentFeeRow | null>(null);

  // Stats - Ideally these would be fetched server-side for accurate 9k counts
  // For now, we calculate from current page or use a placeholder
  const stats = useMemo(() => ({
    pending: 0,
    verified: 0,
    rejected: 0,
    unpaid: 0,
  }), []);

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
    console.log(log)
    setDetailOpen(true);
  };

  const handleManualLogRequest = (studentId: string) => {
    // studentId here is actually the userId (from student.id)
    const matchedRow = studentRows.find((row) => row.userId === studentId);
    setStudentRowFee(matchedRow || null);
    setManualLogOpen(true);
  };

  const handleDataViewChange = (v: string): void => {
    setDataView(v as "submissions" | "all-students");
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
      paginatedLogs: logs,
      paginatedRows: studentRows,
      stats,
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
