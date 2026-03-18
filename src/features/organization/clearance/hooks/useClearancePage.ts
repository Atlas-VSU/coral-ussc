"use client"

import { useState, useRef, useMemo } from "react"
import { toast } from "sonner"
import { useClearances } from "../hooks/useClearances"
import { useClearanceActions } from "../hooks/useClearanceAction"
import { useManualPaymentSelection } from "../hooks/useManualPaymentSelection"
import { getCurrentUserData } from "@/firebase"
import { Member } from "../../members/types"
import { PaymentType } from "@/constants/types"
import type { ViewMode } from "@/components/organization/ViewToggle"
import type { ClearanceStatus } from "../types"
import type { ReceiptData } from "@/components/organization/PaymentReceiptDialog"
import { generateReceiptId } from "../../payments/utils"
import { ProofOfPayment } from "../../fines/types"
import { usePaymentApproval } from "../../payments/hooks/usePaymentApproval"

export function useClearancePage(orgId: string | undefined) {
  const { clearances, loading, setClearances } = useClearances(orgId)
  
  // Filtering & View state
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [currentPage, setCurrentPage] = useState(1)

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

  // Derived state: Filtered/Paginated data
  const filtered = useMemo(() => {
    return clearances.filter(c => {
      const matchesSearch = c.userName.toLowerCase().includes(search.toLowerCase()) || 
                            c.studentId.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = filterStatus === "all" || c.status === filterStatus
      return matchesSearch && matchesStatus
    })
  }, [clearances, search, filterStatus])

  const totalPages = Math.ceil(filtered.length / 10)
  const paginated = filtered.slice((currentPage - 1) * 10, currentPage * 10)

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
      referenceNo: payment?.referenceNumber || "",
      submittedAt: payment?.submittedAt.toDate().toISOString(),
      approveConfirmMessage: "This item will be marked as cleared.",
    }
  }, [payment, clearances])

  const setPage = (page: number) => setCurrentPage(page)
  const updateSearch = (v: string) => { setSearch(v); setPage(1) }
  const updateFilterStatus = (v: string) => { setFilterStatus(v); setPage(1) }

  return {
    // Data
    clearances,
    loading,
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
  }
}
