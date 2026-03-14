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

export function useClearancePage(orgId: string | undefined) {
  const { clearances, loading, setClearances } = useClearances(orgId)
  
  // Filtering & View state
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [currentPage, setCurrentPage] = useState(1)

  // Payment Review state
  const [paymentReviewOpen, setPaymentReviewOpen] = useState(false)
  const [reviewTarget, setReviewTarget] = useState<{ clearanceId: string; referenceId: string } | null>(null)

  // Log Payment state
  const [logPaymentOpen, setLogPaymentOpen] = useState(false)
  const [logPaymentTarget, setLogPaymentTarget] = useState<ClearanceStatus | null>(null)

  // Receipt state
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)

  const [isProcessing, setIsProcessing] = useState(false)
  const idCounter = useRef(0)

  const { approvePayment, rejectPayment, logManualPayment } = useClearanceActions(clearances, setClearances)
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
  const openPaymentReview = (clearanceId: string, referenceId: string) => {
    setReviewTarget({ clearanceId, referenceId })
    setPaymentReviewOpen(true)
  }

  const handleApprovePayment = async () => {
    if (!reviewTarget) return
    setIsProcessing(true)
    try {
      await approvePayment(reviewTarget.clearanceId, [reviewTarget.referenceId])
      setReviewTarget(null)
      setPaymentReviewOpen(false)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRejectPayment = async (reason: string) => {
    if (!reviewTarget) return
    setIsProcessing(true)
    try {
      await rejectPayment(reviewTarget.clearanceId, [reviewTarget.referenceId], reason)
      setReviewTarget(null)
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
    try {
      await logManualPayment(
        logPaymentTarget.id,
        Array.from(selection.selectedRefIds),
        selection.total,
        new Date().toISOString().slice(0, 10)
      )

      idCounter.current += 1
      const currentUser = await getCurrentUserData() as unknown as Member;
      setReceiptData({
        receiptId: `CLR-${idCounter.current}`,
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
    if (!reviewTarget) return null
    const clearance = clearances.find(c => c.id === reviewTarget.clearanceId)
    if (!clearance) return null
    const item = clearance.blockingItems[reviewTarget.referenceId]
    if (!item) return null
    
    return {
      lineItems: [{ label: item.title, amount: item.balance }],
      amountPaid: item.balance,
      paymentMethod: item.paymentHistory[0]?.paymentMethod || "cash",
      referenceNo: item.paymentHistory[0]?.gcashReference || "",
      submittedAt: item.paymentHistory[0]?.createdAt.toDate().toISOString(),
      approveConfirmMessage: "This item will be marked as cleared.",
    }
  }, [reviewTarget, clearances])

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
