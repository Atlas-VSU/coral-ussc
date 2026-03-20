
"use client"
import { useState, useMemo, useEffect, useCallback } from "react"
import { toast } from "sonner"
import type { StudentUnpaidRecord } from "../types"
import { ITEMS_PER_PAGE } from "../config"
import { usePayments } from "./usePayments"
import { ProofOfPayment } from "../../fines/types"
import { PaymentStatus } from "@/constants/status"
import { ViewMode } from "@/components/organization/ViewToggle"
import { getCurrentUserData, getProgramById } from "@/firebase"
import { PaymentFormData } from "@/lib/validators"
import { createBulkOfflineProofOfPayment } from "@/firebase/payment/create/proofOfPayment"
import { generateReceiptId } from "../utils"
import { Member } from "../../members/types"
import { ReceiptData } from "@/components/organization/PaymentReceiptDialog"
import { PaymentMethods, PaymentType } from "@/constants/types"
import { usePaymentApproval } from "./usePaymentApproval"
import { useDebounce } from "@/hooks/useDebounce"

export function usePaymentsPage() {
  const {
    payments,
    unpaidPayments,
    setUnpaidPayments,
    search,
    setSearch,
    isLoading,
    isLoadingUnpaid,
    refetchPayments,
    setTotalUnpaidCount,
    totalUnpaidCount,
    unpaidPage,
    setUnpaidPage,
    searchCount
  } = usePayments()

  // ── Tab ───────────────────────────────────────────────────────────────────
  const [dataView, setDataView] = useState<"submissions" | "unpaid">("submissions")

  // ── Submissions ───────────────────────────────────────────────────────────
  const [paymentsList, setPaymentsList] = useState<ProofOfPayment[]>([])
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedPayment, setSelectedPayment] = useState<ProofOfPayment | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [loading, setLoading] = useState(false)

  // ── Unpaid ────────────────────────────────────────────────────────────────
  const [unpaidSearch, setUnpaidSearch] = useState("")
  const [unpaidViewMode, setUnpaidViewMode] = useState<ViewMode>("table")

  // ── Unpaid detail modal ───────────────────────────────────────────────────
  const [selectedUnpaid, setSelectedUnpaid] = useState<StudentUnpaidRecord | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [checkedDues, setCheckedDues] = useState<Set<string>>(new Set())
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10))

  // ── Receipt ───────────────────────────────────────────────────────────────
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)

  // ── Student program ───────────────────────────────────────────────────────
  const [studentProgram, setStudentProgram] = useState<Awaited<ReturnType<typeof getProgramById>> | null>(null)

  const { _approvePayment, _rejectPayment } = usePaymentApproval()

  // ── Sync payments into local state ───────────────────────────────────────
  useEffect(() => { setPaymentsList(payments) }, [payments])

  // ── Debounced search → triggers server fetch ──────────────────────────────
  const debouncedUnpaidSearch = useDebounce(unpaidSearch, 400)

  useEffect(() => {
    // Reset to page 1 and fetch with new search term
    setUnpaidPage(1)
    setSearch(debouncedUnpaidSearch)
  }, [debouncedUnpaidSearch])

  // Fetch student program when selected unpaid changes
  useEffect(() => {
    if (!selectedUnpaid) return
    let cancelled = false
    getProgramById(selectedUnpaid.student.programId)
      .then(program => { if (!cancelled) setStudentProgram(program ?? null) })
      .catch(err => {
        console.error("Error fetching student program:", err)
        toast.error("Could not fetch student program information.")
      })
    return () => { cancelled = true }
  }, [selectedUnpaid])

  // ── Derived: submissions ──────────────────────────────────────────────────
  const filtered = useMemo(() => paymentsList.filter(p => {
    const q = search.toLowerCase()
    const matchesSearch = p.userName.toLowerCase().includes(q) || p.studentId.toLowerCase().includes(q)
    const matchesStatus = filterStatus === "all" || p.status === filterStatus
    return matchesSearch && matchesStatus
  }), [paymentsList, search, filterStatus])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [filtered, currentPage]
  )

  // ── Derived: unpaid — server already filtered, just paginate in memory ────
  const unpaidTotalPages = Math.ceil(totalUnpaidCount / ITEMS_PER_PAGE)
  const paginatedUnpaid = unpaidPayments;

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    pending:  paymentsList.filter(p => p.status === "pending").length,
    approved: paymentsList.filter(p => p.status === "verified").length,
    declined: paymentsList.filter(p => p.status === "rejected").length,
    unpaid:   totalUnpaidCount,
  }), [paymentsList, unpaidPayments])

  // ── Live unpaid record (keeps modal in sync after mutations) ──────────────
  const liveSelectedUnpaid = useMemo(
    () => unpaidPayments.find(r => r.student.studentId === selectedUnpaid?.student.studentId) ?? null,
    [unpaidPayments, selectedUnpaid],
  )

  const selectedDues = useMemo(
    () => liveSelectedUnpaid?.dues.filter(d => checkedDues.has(d.id)) ?? [],
    [liveSelectedUnpaid, checkedDues]
  )

  const selectedTotal = useMemo(
    () => selectedDues.reduce((s, d) => s + d.balance, 0),
    [selectedDues]
  )

  // ── Handlers: submissions ─────────────────────────────────────────────────
  const handleApprove = useCallback(async (payment: ProofOfPayment) => {
    setLoading(true)
    try {
      const result = await _approvePayment(payment)
      setReceiptData(result?.receipt!)
      setReceiptOpen(true)
      setDetailOpen(false)
      toast.success("Payment approved successfully")
    } catch (error) {
      console.error("Error approving payment:", error)
      toast.error("Failed to approve payment. Please try again.")
    } finally {
      setLoading(false)
    }
    setPaymentsList(prev => prev.map(p => p.id !== payment.id ? p : {
      ...p,
      status: "verified" as PaymentStatus,
      reviewedDate: new Date().toISOString().split("T")[0],
      reviewedBy: "Admin",
    }))
    setSelectedPayment(null)
  }, [_approvePayment])

  const handleDecline = useCallback(async (payment: ProofOfPayment, reason: string) => {
    setLoading(true)
    try {
      await _rejectPayment(payment, reason)
      setPaymentsList(prev => prev.map(p => p.id !== payment.id ? p : {
        ...p,
        status: "rejected" as PaymentStatus,
        reviewedDate: new Date().toISOString().split("T")[0],
        reviewedBy: "Admin",
        remarks: reason,
      }))
      setDetailOpen(false)
      setSelectedPayment(null)
      toast.success("Payment declined successfully")
    } catch (error) {
      console.error("Error declining payment:", error)
      toast.error("Failed to decline payment. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [_rejectPayment])

  const openReview = useCallback((payment: ProofOfPayment) => {
    setSelectedPayment(payment)
    setReviewOpen(true)
  }, [])

  // ── Handlers: unpaid ──────────────────────────────────────────────────────
  const openUnpaidDetail = useCallback((record: StudentUnpaidRecord) => {
    setSelectedUnpaid(record)
    setCheckedDues(new Set())
    setPaymentDate(new Date().toISOString().slice(0, 10))
    setDetailOpen(true)
  }, [])

  const toggleDue = useCallback((dueId: string) => {
    setCheckedDues(prev => {
      const next = new Set(prev)
      next.has(dueId) ? next.delete(dueId) : next.add(dueId)
      return next
    })
  }, [])

  const toggleAllDues = useCallback(() => {
    if (!liveSelectedUnpaid) return
    const allIds = liveSelectedUnpaid.dues.map(d => d.id)
    const allChecked = allIds.every(id => checkedDues.has(id))
    setCheckedDues(allChecked ? new Set() : new Set(allIds))
  }, [liveSelectedUnpaid, checkedDues])

  const handleLogPayment = useCallback(async () => {
    if (!liveSelectedUnpaid || selectedDues.length === 0) return
    setLoading(true)

    const receiptId = generateReceiptId()
    const studentName = `${liveSelectedUnpaid.student.firstName} ${liveSelectedUnpaid.student.lastName}`
    let isFine = false, isFee = false, totalAmount = 0

    for (const due of selectedDues) {
      if (due.type === "fines") isFine = true
      if (due.type === "fees") isFee = true
      totalAmount += due.balance
    }

    const lineItems: PaymentFormData = {
      userName: studentName,
      studentId: liveSelectedUnpaid.student.studentId,
      amount: totalAmount,
      paymentMethod: PaymentMethods.CASH,
      referenceNumber: "",
      notes: `Manual payment for ${isFine && isFee ? "fees and fines" : isFine ? "fines" : "fees"}`,
      type: isFine && isFee ? PaymentType.BULK : isFine ? PaymentType.FINES : PaymentType.FEES,
      referenceId: selectedDues.length > 1 ? "bulk_transaction" : selectedDues[0].parentId,
    }

    try {
      await createBulkOfflineProofOfPayment(lineItems, receiptId, selectedDues, liveSelectedUnpaid.student.id!)
    } catch (error) {
      toast.error("Failed to log payment. Please try again.")
      setLoading(false)
      return
    }

    refetchPayments()

    // Optimistic update — remove settled dues from local state
    const settledIds = new Set(selectedDues.map(d => d.id))
    setUnpaidPayments(prev => prev
      .map(r => {
        if (r.student.studentId !== liveSelectedUnpaid.student.studentId) return r
        const remaining = r.dues.filter(d => !settledIds.has(d.id))
        return remaining.length > 0 ? { ...r, dues: remaining } : null
      })
      .filter(Boolean) as StudentUnpaidRecord[]
    )

    const currentUser = await getCurrentUserData() as unknown as Member
    setReceiptData({
      receiptId,
      studentName,
      studentId: liveSelectedUnpaid.student.studentId,
      items: selectedDues.map(d => ({ name: d.name, type: d.type as "fees" | "fines", amount: d.balance })),
      total: selectedTotal,
      date: paymentDate,
      verifiedByName: `${currentUser.firstName} ${currentUser.lastName}`,
      paymentMethod: "Cash (Manual)",
    })

    setDetailOpen(false)
    setReceiptOpen(true)
    setLoading(false)
    toast.success("Payment logged successfully")
  }, [liveSelectedUnpaid, selectedDues, selectedTotal, paymentDate, refetchPayments, setUnpaidPayments])

  // ── Tab change ────────────────────────────────────────────────────────────
  const handleTabChange = useCallback((value: "submissions" | "unpaid") => {
    setDataView(value)
    setCurrentPage(1)
    setUnpaidPage(1)
    setFilterStatus("all")
    setSearch("")
  }, [])

  return {
    dataView, handleTabChange,
    isLoading, loading, isLoadingUnpaid,
    paymentsList, search, setSearch, filterStatus, setFilterStatus,
    selectedPayment, setSelectedPayment,
    currentPage, setCurrentPage,
    reviewOpen, setReviewOpen,
    viewMode, setViewMode,
    filtered, totalPages, paginated,
    handleApprove, handleDecline, openReview,
    unpaidSearch, setUnpaidSearch,
    unpaidPage, setUnpaidPage,
    unpaidViewMode, setUnpaidViewMode,
    filteredUnpaid: unpaidPayments,
    unpaidTotalPages, paginatedUnpaid,
    detailOpen, setDetailOpen,
    liveSelectedUnpaid,
    checkedDues, selectedDues, selectedTotal,
    paymentDate, setPaymentDate,
    toggleDue, toggleAllDues, openUnpaidDetail, handleLogPayment,
    studentProgram,
    receiptOpen, setReceiptOpen, receiptData, setReceiptData,
    stats,
    refetchPayments, totalUnpaidCount
  }
}