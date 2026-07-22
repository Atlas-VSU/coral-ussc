"use client"

import { useState, useRef, useMemo, useEffect } from "react"
import { toast } from "sonner"
import { Timestamp } from "firebase/firestore"
import { useAuth } from "@/hooks/useAuth"

import { useClearances } from "./useClearances"
import { useClearanceActions } from "./useClearanceAction"
import { useManualPaymentSelection } from "./useManualPaymentSelection"
import { fetchStats, getClearanceStats, getCurrentUserData } from "@/firebase"
import { Member } from "../../members/types"
import { PaymentType, Term } from "@/constants/types"
import type { ViewMode } from "@/components/organization/general/ViewToggle"
import type { ClearanceStatus } from "../types"
import type { ReceiptData } from "@/components/organization/receipt/PaymentReceiptDialog"
import { generateReceiptId } from "../../payments/utils"
import { ProofOfPayment } from "../../fines/types"
import { usePaymentApproval } from "../../payments/hooks/usePaymentApproval"
import { cacheService, CACHE_KEYS } from "@/services/cacheService";
import { ITEMS_PER_PAGE } from "../config";
import { getActiveTerm } from "@/firebase/term"
import { fetchAllClearanceForExport, seedClearanceDocuments } from "@/firebase/clearance"
import { exportClearanceToCSV } from "@/utils/exportUtils"
import { useTermPeriod } from "../../term/hooks/useTermPeriod"
import { getOrgById } from "@/firebase/organization"

export function useClearancePage(orgId: string | undefined) {
  const { user: currentUser } = useAuth()
  // Filtering & View state

  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [currentPage, setCurrentPage] = useState(1)
  const [needsSeed, setNeedsSeed] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const { selected } = useTermPeriod()
  const user = useAuth();

  const { clearances, loading, totalCount, setClearances, hardRefresh: baseHardRefresh, hasNextPage, stats, fetchStatsData, AY, sem } = useClearances(
    orgId,
    ITEMS_PER_PAGE,
    search,
    filterStatus,
    currentPage
  )

  // After loading completes: if nothing is found for this term, prompt seeding
  useEffect(() => {
    if (!loading && totalCount === 0 && !search && filterStatus === "all") {
      setNeedsSeed(true)
    } else {
      setNeedsSeed(false)
    }
  }, [loading, totalCount, search, filterStatus])

  // Reset page when term changes
  useEffect(() => {
    setCurrentPage(1)
    setSearch("")
    setFilterStatus("all")
  }, [selected])

  // Payment Review state
  const [paymentReviewOpen, setPaymentReviewOpen] = useState(false)

  // Log Payment state
  const [logPaymentOpen, setLogPaymentOpen] = useState(false)
  const [logPaymentTarget, setLogPaymentTarget] = useState<ClearanceStatus | null>(null)

  // Receipt state
  // const [receiptOpen, setReceiptOpen] = useState(false)
  // const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)

  const [isProcessing, setIsProcessing] = useState(false)
  const [payment, setPayment] = useState<ProofOfPayment | null>(null)

  const { _approvePayment, _rejectPayment } = usePaymentApproval();
  
  const idCounter = useRef(0)

  const { /*approvePayment, rejectPayment,*/ logManualPayment, receiptData,setReceiptData, setReceiptOpen, receiptOpen } = useClearanceActions(clearances, setClearances)
  const selection = useManualPaymentSelection(logPaymentTarget)

  // Paginated and filtered data now comes directly from the server via useClearances
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
  const paginated = clearances // In server-side pagination, clearances only contains the current page
  const filtered = clearances // Simplified for backwards compatibility in UI if needed

  // Handlers: Payment Review
  const openPaymentReview = (payment: ProofOfPayment) => {
    setPayment(payment)
    setPaymentReviewOpen(true)
  }

  


  const handleApprovePayment = async () => {
    if (!payment) return
    setIsProcessing(true)
    try {
      // await approvePayment(reviewTarget.clearanceId, [reviewTarget.referenceId])
      const result = await _approvePayment(payment);
      
      // Optimistic update
      const referenceIds = payment.metadata.items?.map(i => i.refId) || [];
      const clearanceId = payment.referenceId; // In clearance context, referenceId in ProofOfPayment is often used for the refId, but we need the clearance record ID.
  
      
      setClearances(prev => prev.map(cl => {
        // Find by studentId or userId since we don't have the clearanceId explicitly in the payment object easily
        if (cl.studentId !== payment.studentId && cl.userId !== payment.studentId) return cl;
        
        const updatedBlocking = { ...cl.blockingItems };
        referenceIds.forEach(refId => {
          const item = updatedBlocking[refId];
          if (!item) return;
          
          const newItem = { ...item };
          newItem.status = "paid";
          newItem.pendingReview = false;
          // newItem.paymentHistory = newItem.paymentHistory.map(p => 
          //   p.status === "pending" 
          //     ? {
          //         ...p,
          //         status: "verified",
          //         verifiedAt: Timestamp.now(),
          //         verifiedByName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Admin",
          //       } 
          //     : p
          // );
          updatedBlocking[refId] = newItem;
        });
        
        const overallStatus = Object.values(updatedBlocking).some(
          i => (i.status === "unpaid") && i.isRequiredForClearance
        ) ? "not_cleared" : "cleared";
        
        return { ...cl, blockingItems: updatedBlocking, status: overallStatus };
      }));

      // Invalidate cache
      cacheService.invalidate(CACHE_KEYS.proofOfPaymentByUser(payment.studentId, payment.orgId));

      setReceiptData(result?.receipt!);
      setReceiptOpen(true);
      setPaymentReviewOpen(false)
    } finally {
      setIsProcessing(false)
    }

  }

  const handleRejectPayment = async (reason: string) => {
    if (!payment) return
    setIsProcessing(true)
    try {
      // await rejectPayment(reviewTarget.clearanceId, [reviewTarget.referenceId], reason)
      await _rejectPayment(payment, reason);

      // Optimistic update
      const referenceIds = payment.metadata.items?.map(i => i.refId) || [];
      
      setClearances(prev => prev.map(cl => {
        if (cl.studentId !== payment.studentId && cl.userId !== payment.studentId) return cl;
        
        const updatedBlocking = { ...cl.blockingItems };
        referenceIds.forEach(refId => {
          const item = updatedBlocking[refId];
          if (!item) return;
          
          const newItem = { ...item };
          newItem.status = "unpaid";
          newItem.pendingReview = false;
          // newItem.paymentHistory = newItem.paymentHistory.map(p => 
          //   p.status === "pending" 
          //     ? {
          //         ...p,
          //         status: "rejected",
          //         rejectionReason: reason,
          //         verifiedAt: Timestamp.now(),
          //         verifiedByName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Admin",
          //       } 
          //     : p
          // );
          updatedBlocking[refId] = newItem;
        });
        
        const overallStatus = Object.values(updatedBlocking).some(
          i => (i.status === "unpaid" || i.balance > 0) && i.isRequiredForClearance
        ) ? "not_cleared" : "cleared";
        
        return { ...cl, blockingItems: updatedBlocking, status: overallStatus };
      }));

      // Invalidate cache
      cacheService.invalidate(CACHE_KEYS.proofOfPaymentByUser(payment.studentId, payment.orgId));

      setPaymentReviewOpen(false)
    } finally {
      setIsProcessing(false)
    }

  }

  // Handlers: Log Payment
  const openLogPayment = (clearanceId: string) => {
    const clearance = clearances.find(c => c.id === clearanceId) ?? null
    setLogPaymentTarget(clearance)
    setLogPaymentOpen(true)
  }

  const handleLogPayment = async () => {
    const org = await getOrgById(user.user?.orgId!)
    if (!logPaymentTarget || selection.selectedRefIds.size === 0 || !org) return

    setIsProcessing(true)
    const receipt = generateReceiptId(org.shortName);
    try {
      await logManualPayment(
        logPaymentTarget.id,
        Array.from(selection.selectedRefIds),
        selection.total,
        new Date().toISOString().slice(0, 10),
        receipt
      )
      const term = await getActiveTerm();

      // Invalidate the individual doc cache since it was updated
      cacheService.invalidate(CACHE_KEYS.clearanceDoc(logPaymentTarget.id));
      
      idCounter.current += 1
      const currentUser = await getCurrentUserData() as unknown as Member;
      setReceiptData({
        receiptId: receipt,
        studentName: logPaymentTarget.userName,
        studentId: logPaymentTarget.studentId,
        items: selection.selectedItems.map(i => ({
          name: i.label,
          type: i.type === PaymentType.FEES ? "fees" : "fines",
          amount: i.amount,
        })),
        total: selection.total,
        date: new Date().toLocaleString(),
        verifiedByName: currentUser.firstName + " " + currentUser.lastName,
        paymentMethod: "Cash",
        AY: term!.AY,
        semester: term!.semester,
      })

      setLogPaymentOpen(false)
      setReceiptOpen(true)
      toast.success(`Payment logged for ${logPaymentTarget.userName}`)
      setLogPaymentTarget(null)
      selection.clearSelection()
    } finally {
      setIsProcessing(false)
    }
  }

  const reviewData = useMemo(() => {
    if (!payment) return null
    return {
      lineItems: payment?.metadata.items?.map((p)=>({ label: p.title, amount: p.amount })) || [],
      amountPaid: payment?.amount || 0,
      paymentMethod: payment?.paymentMethod,
      receiptContent: payment?.imageUrl,
      studentName: payment?.userName,
      studentId: payment?.studentId,
      typeLabel: payment?.paymentType,
      referenceNo: payment?.referenceNumber || "",
      submittedAt: payment?.submittedAt.toDate().toISOString().slice(0, 10),
      notes: payment?.notes,
      approveConfirmMessage: "This item will be marked as cleared.",
      declineRemarks: payment?.rejectionReason || ""
    }
  }, [payment, clearances])

  const setPage = (page: number) => setCurrentPage(page)
  const updateSearch = (v: string) => { setSearch(v); setPage(1) }
  const updateFilterStatus = (v: string) => { setFilterStatus(v); setPage(1) }

  const handleHardRefresh = async () => {
    if (!orgId) return;
    // Invalidate all stat slices for this org (any term) — key format is
    // "clearance:stats:{orgId}:{statusFilter}:{AY}-{semester}" so prefixing on
    // orgId wipes everything without needing to know the current term here.
    cacheService.invalidateByPrefix(`clearance:stats:${orgId}`)
    await baseHardRefresh()
  }

  const handleSeedClearance = async () => {
    if (!currentUser || isSeeding) return;
    setIsSeeding(true);
    try {
      await seedClearanceDocuments(currentUser, selected as Term);
      toast.success("Clearance records generated successfully!");
      setNeedsSeed(false);
      await baseHardRefresh();
    } catch (err) {
      console.error("Seeding clearance failed:", err);
      toast.error("Failed to generate clearance records. Please try again.");
    } finally {
      setIsSeeding(false);
    }
  }

  const handleExport = async () => {
    if (!orgId || isExporting) return;
    setIsExporting(true);
    try {
      // Derive the exclusion prefix from the AY:
      // For AY "2025-2026" → exclude "26-" (newly enrolled batch not yet in org)
      // For AY "2026-2027" → exclude "27-", and so on.
      const secondYear = AY.split("-")[1];
      const excludePrefix = secondYear ? `${secondYear.slice(-2)}-` : undefined;
      const records = await fetchAllClearanceForExport(
        orgId,
        { AY, semester: sem },
        excludePrefix
      );
      if (records.length === 0) {
        toast.info(`No clearance records found for ${sem} Semester A.Y. ${AY}.`);
        return;
      }
      const semSlug = sem.replace(/\s+/g, "-").toLowerCase();
      const aySlug = AY.replace(/\s+/g, "");
      exportClearanceToCSV(records, `clearance-${semSlug}-sem-${aySlug}.csv`);
      toast.success(`Exported ${records.length} clearance records.`);
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Failed to export clearance records. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  return {
    // Data
    clearances,
    loading,
    totalCount,
    filtered,
    paginated,
    totalPages,
    reviewData,
    stats,
    hasNextPage,
    AY,
    sem,
    needsSeed,
    isSeeding,
    isExporting,
    
    // UI State
    search,
    filterStatus,
    viewMode,
    currentPage,
    isProcessing,
    
    // Dialogs
    paymentReviewOpen,
    setPaymentReviewOpen,
    logPaymentOpen,
    setLogPaymentOpen,
    logPaymentTarget,
    receiptOpen,
    setReceiptOpen,
    receiptData,
    
    // Selection for Log Payment
    selection,

    // Handlers
    setSearch: updateSearch,
    setFilterStatus: updateFilterStatus,
    setViewMode,
    setCurrentPage: setPage,
    openPaymentReview,
    handleApprovePayment,
    handleRejectPayment,
    openLogPayment,
    handleLogPayment,
    hardRefresh: handleHardRefresh,
    handleSeedClearance,
    handleExport,
  }
}
