
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
import { getProofOfPaymentsCount } from "@/firebase/payment/read/proofOfPayment"
import { Timestamp } from "firebase/firestore"

export function usePaymentsPage() {
  const {
    payments,
    unpaidPayments,
    setUnpaidPayments,
    search,
    setSearch,
    unpaidSearch,
    setUnpaidSearch,
    isLoading,
    isLoadingUnpaid,
    refetchPayments,
    refetchUnpaids,
    setTotalUnpaidCount,
    totalUnpaidCount,
    unpaidPage,
    setUnpaidPage,
    searchCount,
    submissionPage,
    setSubmissionPage,
    totalSubmissionCount,
    currentOrgIdRef,
    filterStatus,
    setFilterStatus,
    stats,
  } = usePayments()

  // ── Tab ───────────────────────────────────────────────────────────────────
  const [dataView, setDataView] = useState<"submissions" | "unpaid">("submissions")

  // ── Submissions ───────────────────────────────────────────────────────────
  const [paymentsList, setPaymentsList] = useState<ProofOfPayment[]>([])
  const [selectedPayment, setSelectedPayment] = useState<ProofOfPayment | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [loading, setLoading] = useState(false)

  // ── Unpaid ────────────────────────────────────────────────────────────────
  // const [unpaidSearch, setUnpaidSearch] = useState("")
  const [unpaidViewMode, setUnpaidViewMode] = useState<ViewMode>("table")

  // ── Unpaid detail modal ───────────────────────────────────────────────────
  const [selectedUnpaid, setSelectedUnpaid] = useState<StudentUnpaidRecord | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [checkedDues, setCheckedDues] = useState<Set<string>>(new Set())
  const [paymentDate, setPaymentDate] = useState(Timestamp.now())

  // ── Receipt ───────────────────────────────────────────────────────────────
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)

  // ── Student program ───────────────────────────────────────────────────────
  const [studentProgram, setStudentProgram] = useState<Awaited<ReturnType<typeof getProgramById>> | null>(null)

  const { _approvePayment, _rejectPayment } = usePaymentApproval()

  // ── Sync payments into local state ───────────────────────────────────────
  useEffect(() => { setPaymentsList(payments) }, [payments])

  // ── Debounced search → triggers server fetch ──────────────────────────────
  const [unpaidSearchInput, setUnpaidSearchInput] = useState("")
  const [submissionSearchInput, setSubmissionSearchInput] = useState("")
  const debouncedUnpaidSearch = useDebounce(unpaidSearchInput, 400)
  const debouncedPaymentSearch = useDebounce(submissionSearchInput, 400)

  useEffect(() => {
    // Reset to page 1 and fetch with new search term
    setUnpaidPage(1)
    setUnpaidSearch(debouncedUnpaidSearch)
  }, [debouncedUnpaidSearch])

    useEffect(() => {
    // Reset to page 1 and fetch with new search term
    setSubmissionPage(1)
    setSearch(debouncedPaymentSearch)
  }, [debouncedPaymentSearch])


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

  const totalPages = Math.ceil(totalSubmissionCount / ITEMS_PER_PAGE)
  const paginated = payments;
  

  // ── Derived: unpaid — server already filtered, just paginate in memory ────
  const unpaidTotalPages = Math.ceil(totalUnpaidCount / ITEMS_PER_PAGE)
  const paginatedUnpaid = unpaidPayments;

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
      refetchPayments()
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
      refetchPayments()
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
    setPaymentDate(Timestamp.now())
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
      await createBulkOfflineProofOfPayment(lineItems, receiptId, selectedDues, liveSelectedUnpaid.student.id!, paymentDate)
    } catch (error) {
      toast.error("Failed to log payment. Please try again.")
      setLoading(false)
      return
    }

    refetchPayments()
    refetchUnpaids()

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
    setTotalUnpaidCount(prev => prev -1 )

    const currentUser = await getCurrentUserData() as unknown as Member
    setReceiptData({
      receiptId,
      studentName,
      studentId: liveSelectedUnpaid.student.studentId,
      items: selectedDues.map(d => ({ name: d.name, type: d.type as "fees" | "fines", amount: d.balance })),
      total: selectedTotal,
      date: paymentDate.toDate().toLocaleString(),
      verifiedByName: `${currentUser.firstName} ${currentUser.lastName}`,
      paymentMethod: "Cash (Manual)",
    })

    setReceiptOpen(true)
    setDetailOpen(false)
    setLoading(false)
    toast.success("Payment logged successfully")
  }, [liveSelectedUnpaid, selectedDues, selectedTotal, paymentDate, setUnpaidPayments])

  // ── Tab change ────────────────────────────────────────────────────────────
  const handleTabChange = useCallback((value: "submissions" | "unpaid") => {
    setDataView(value)
    setUnpaidPage(1)
    setSubmissionPage(1)
    setFilterStatus("all")
    setSearch("")
    setUnpaidSearch("")
  }, [])

  const refreshAll = useCallback(() => {
    refetchPayments()
    refetchUnpaids()
   },[])

  return {
    dataView, handleTabChange,
    isLoading, loading, isLoadingUnpaid,
    paymentsList, filterStatus, setFilterStatus,
    selectedPayment, setSelectedPayment,
    reviewOpen, setReviewOpen,
    viewMode, setViewMode,
    totalPages, paginated,
    handleApprove, handleDecline, openReview,
    unpaidSearch: unpaidSearchInput,       
    setUnpaidSearch: setUnpaidSearchInput,  
    search: submissionSearchInput,          
    setSearch: setSubmissionSearchInput, 
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
    refetchPayments,refetchUnpaids, refreshAll, totalUnpaidCount, totalSubmissionCount,
    submissionPage, setSubmissionPage, searchCount
  }
}