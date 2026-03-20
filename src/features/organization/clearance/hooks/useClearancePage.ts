"use client"

import { useState, useRef, useMemo } from "react"
import { toast } from "sonner"
import { useClearances } from "./useClearances"
import { useClearanceActions } from "./useClearanceAction"
import { useManualPaymentSelection } from "./useManualPaymentSelection"
import { getCurrentUserData } from "@/firebase"
import { Member } from "../../members/types"
import { PaymentType } from "@/constants/types"
import type { ViewMode } from "@/components/organization/ViewToggle"
import type { ClearanceStatus } from "../types"
import type { ReceiptData } from "@/components/organization/PaymentReceiptDialog"
import { generateReceiptId } from "../../payments/utils"
import { ProofOfPayment } from "../../fines/types"
import { usePaymentApproval } from "../../payments/hooks/usePaymentApproval"
import { cacheService, CACHE_KEYS } from "@/services/cacheService";

export function useClearancePage(orgId: string | undefined) {
  // Filtering & View state
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const { clearances, loading, totalCount, setClearances, hardRefresh } = useClearances(
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

  const handleApprovePayment = async () => {
    if (!payment) return
    setIsProcessing(true)
    try {
      // await approvePayment(reviewTarget.clearanceId, [reviewTarget.referenceId])
      const result = await _approvePayment(payment);
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
        date: new Date().toISOString().slice(0, 10),
        verifiedByName: currentUser.firstName + " " + currentUser.lastName,
        paymentMethod: "Cash (Manual)",
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
