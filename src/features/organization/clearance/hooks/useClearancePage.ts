"use client"

import { useState, useRef, useMemo, useEffect } from "react"
import { toast } from "sonner"
import { Timestamp } from "firebase/firestore"
import { useAuth } from "@/hooks/useAuth"

import { useClearances } from "./useClearances"
import { useClearanceActions } from "./useClearanceAction"
import { useManualPaymentSelection } from "./useManualPaymentSelection"
import { getClearanceStats, getCurrentUserData } from "@/firebase"
import { Member } from "../../members/types"
import { PaymentType } from "@/constants/types"
import type { ViewMode } from "@/components/organization/ViewToggle"
import type { ClearanceStatus } from "../types"
import type { ReceiptData } from "@/components/shared/PaymentReceiptDialog"
import { generateReceiptId } from "../../payments/utils"
import { ProofOfPayment } from "../../fines/types"
import { usePaymentApproval } from "../../payments/hooks/usePaymentApproval"
import { cacheService, CACHE_KEYS } from "@/services/cacheService";

export function useClearancePage(orgId: string | undefined) {
  const { user: currentUser } = useAuth()
  // Filtering & View state

  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [currentPage, setCurrentPage] = useState(1)
  const [stats, setStats] = useState<{ cleared: number; not_cleared: number; pending: number }>({
    cleared: 0,
    not_cleared: 0,
    pending: 0,
  })
  const pageSize = 10

  const { clearances, loading, totalCount, setClearances, hardRefresh, hasNextPage } = useClearances(
    orgId,
    pageSize,
    search,
    filterStatus,
    currentPage
  )

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
  const totalPages = Math.ceil(totalCount / pageSize)
  const paginated = clearances // In server-side pagination, clearances only contains the current page
  const filtered = clearances // Simplified for backwards compatibility in UI if needed

  // Handlers: Payment Review
  const openPaymentReview = (payment: ProofOfPayment) => {
    setPayment(payment)
    setPaymentReviewOpen(true)
  }

  const fetchStats = async () => {
    const orgId = currentUser?.uid;
    if (!orgId) return;
    const [cleared, not_cleared, pending] = await Promise.all([
      getClearanceStats(orgId, "cleared"),
      getClearanceStats(orgId, "not_cleared"),
      getClearanceStats(orgId, "pending"),
    ])
    setStats({ cleared, not_cleared, pending })

    const stats = {cleared, not_cleared, pending}
    cacheService.set(`clearance_stats_${orgId}`, stats, 5 * 60 * 1000);
  }

  useEffect(() => {
    fetchStats()
  }, [orgId])

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
          i => (i.status === "unpaid" || i.balance > 0) && i.isRequiredForClearance
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
    if (!logPaymentTarget || selection.selectedRefIds.size === 0) return

    setIsProcessing(true)
    const receipt = generateReceiptId();
    try {
      await logManualPayment(
        logPaymentTarget.id,
        Array.from(selection.selectedRefIds),
        selection.total,
        new Date().toISOString().slice(0, 10),
        receipt
      )

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
    hardRefresh
  }
}
