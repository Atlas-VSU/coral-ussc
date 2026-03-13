"use client"
import { useState, useMemo, useEffect, useCallback } from "react"
import { toast } from "sonner"
import type { StudentUnpaidRecord } from "../types"
import { ITEMS_PER_PAGE } from "../config"
import { usePayments } from "./usePayments"
import { ProofOfPayment } from "../../fines/types"
import { PaymentStatus } from "@/constants/status"
import { ViewMode } from "@/components/organization/ViewToggle"
import { ReceiptData } from "../components/PaymentReceiptDialog"
import { getProgramById } from "@/firebase"
import { PaymentFormData } from "@/lib/validators"
import { createBulkOfflineProofOfPayment } from "@/firebase/payment/create/proofOfPayment"
import { Fee } from "../../fees/types"
import { generateReceiptId } from "../utils"

export function usePaymentsPage() {
  const {
    payments,
    unpaidPayments,
    isLoading,
    refetchPayments,
  } = usePayments();

  // ── Tab ───────────────────────────────────────────────────────────────────
  const [dataView, setDataView] = useState<"submissions" | "unpaid">("submissions")

  // ── Submissions ───────────────────────────────────────────────────────────
  const [paymentsList, setPaymentsList] = useState<ProofOfPayment[]>([])
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedPayment, setSelectedPayment] = useState<ProofOfPayment | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [loading, setLoading] = useState(isLoading)

  // ── Unpaid ────────────────────────────────────────────────────────────────
  const [unpaidRecords, setUnpaidRecords] = useState<StudentUnpaidRecord[]>([])
  const [unpaidSearch, setUnpaidSearch] = useState("")
  const [unpaidPage, setUnpaidPage] = useState(1)
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

  // Sync payments from hook into local state
  useEffect(() => { if (payments.length > 0) setPaymentsList(payments) }, [payments])
  useEffect(() => { if (unpaidPayments.length > 0) setUnpaidRecords(unpaidPayments) }, [unpaidPayments])

  // Fetch student program when selected unpaid changes
  useEffect(() => {
    if (!selectedUnpaid) return;
    let cancelled = false;
    getProgramById(selectedUnpaid.student.programId)
      .then(program => { if (!cancelled) setStudentProgram(program ?? null) })
      .catch(err => {
        console.error("Error fetching student program:", err);
        toast.error("Could not fetch student program information.");
      });
    return () => { cancelled = true };
  }, [selectedUnpaid]);

  // ── Derived: submissions ───────────────────────────────────────
  const filtered = useMemo(() => paymentsList.filter(p => {
    const q = search.toLowerCase()
    const matchesSearch = p.userName.toLowerCase().includes(q) || p.studentId.toLowerCase().includes(q)
    const matchesStatus = filterStatus === "all" || p.status === filterStatus
    return matchesSearch && matchesStatus
  }), [paymentsList, search, filterStatus])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated  = useMemo(
    () => filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [filtered, currentPage]
  )

  // ── Derived: unpaid ────────────────────────────────────────────
  const filteredUnpaid = useMemo(() => unpaidRecords.filter(r => {
    const q = unpaidSearch.toLowerCase()
    return (
      r.student.firstName.toLowerCase().includes(q) ||
      r.student.lastName.toLowerCase().includes(q) ||
      r.student.studentId.toLowerCase().includes(q)
    )
  }), [unpaidRecords, unpaidSearch])

  const unpaidTotalPages = Math.ceil(filteredUnpaid.length / ITEMS_PER_PAGE)
  const paginatedUnpaid  = useMemo(
    () => filteredUnpaid.slice((unpaidPage - 1) * ITEMS_PER_PAGE, unpaidPage * ITEMS_PER_PAGE),
    [filteredUnpaid, unpaidPage]
  )

  // ── Stats ──────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    pending:  paymentsList.filter(p => p.status === "pending").length,
    approved: paymentsList.filter(p => p.status === "verified").length,
    declined: paymentsList.filter(p => p.status === "rejected").length,
    unpaid:   unpaidRecords.length,
  }), [paymentsList, unpaidRecords])

  // ── Live unpaid record (keeps modal in sync after mutations) ──────────────
  const liveSelectedUnpaid = useMemo(
    () => unpaidRecords.find(r => r.student.studentId === selectedUnpaid?.student.studentId) ?? null,
    [unpaidRecords, selectedUnpaid],
  )

  const selectedDues = useMemo(
    () => liveSelectedUnpaid?.dues.filter(d => checkedDues.has(d.id)) ?? [],
    [liveSelectedUnpaid, checkedDues]
  )

  const selectedTotal = useMemo(
    () => selectedDues.reduce((s, d) => s + d.item.balance, 0),
    [selectedDues]
  )

  // ── Handlers: submissions ─────────────────────────────────────────────────
  const handleApprove = useCallback((id: string) => {
    setPaymentsList(prev => prev.map(p => p.id !== id ? p : {
      ...p,
      status: "verified" as PaymentStatus,
      reviewedDate: new Date().toISOString().split("T")[0],
      reviewedBy: "Admin",
    }))
    toast.success("Payment approved successfully")
    setSelectedPayment(null)
  }, [])

  const handleDecline = useCallback((id: string, reason: string) => {
    setPaymentsList(prev => prev.map(p => p.id !== id ? p : {
      ...p,
      status: "rejected" as PaymentStatus,
      reviewedDate: new Date().toISOString().split("T")[0],
      reviewedBy: "Admin",
      remarks: reason,
    }))
    toast.success("Payment declined with remarks")
    setSelectedPayment(null)
  }, [])

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
    setLoading(true);
    if (!liveSelectedUnpaid || selectedDues.length === 0) return

    const receiptId = generateReceiptId()
    const studentName = `${liveSelectedUnpaid.student.firstName} ${liveSelectedUnpaid.student.lastName}`
    const fees = selectedDues.filter(d => d.type === "fee").map(d => d.item)

    const lineItems: PaymentFormData[] = selectedDues.map(due => ({
      userName: studentName,
      studentId: liveSelectedUnpaid.student.studentId,
      amount: due.item.balance,
      paymentMethod: "cash",
      referenceNumber: "",
      notes: `Manual payment for ${due.name}`,
      type: due.type === "fee" ? "fees" : "fines",
      referenceId: due.item.id
    }))

    try {
      console.log("Creating bulk proof of payment with line items:", lineItems, "and receipt ID:", receiptId)
      await createBulkOfflineProofOfPayment(lineItems,receiptId, fees as Fee[])
    } catch (error) {
      toast.error("Failed to log payment. Please try again.")
      setLoading(false)
      return 
    }

    refetchPayments()

    // Remove settled dues from local state
    const settledIds = new Set(selectedDues.map(d => d.id))
    setUnpaidRecords(prev => prev
      .map(r => {
        if (r.student.studentId !== liveSelectedUnpaid.student.studentId) return r
        const remaining = r.dues.filter(d => !settledIds.has(d.id))
        return remaining.length > 0 ? { ...r, dues: remaining } : null
      })
      .filter(Boolean) as StudentUnpaidRecord[]
    )

    setReceiptData({
      receiptId,
      studentName,
      studentId: liveSelectedUnpaid.student.studentId,
      items: selectedDues.map(d => ({ name: d.name, type: d.type as "fee" | "fine", amount: d.item.balance })),
      total: selectedTotal,
      date: paymentDate,
    })

    setDetailOpen(false)
    setReceiptOpen(true)
    setLoading(false)
    toast.success("Payment logged successfully")
  }, [liveSelectedUnpaid, selectedDues, selectedTotal, paymentDate, refetchPayments])

  // ── Tab change ────────────────────────────────────────────────────────────
  const handleTabChange = useCallback((value: "submissions" | "unpaid") => {
    setDataView(value)
    setCurrentPage(1)
    setUnpaidPage(1)
    setFilterStatus("all")
  }, [])

  return {
    // tab
    dataView, handleTabChange,
    isLoading,
    loading,
    // submissions
    paymentsList, search, setSearch, filterStatus, setFilterStatus,
    selectedPayment, setSelectedPayment,
    currentPage, setCurrentPage,
    reviewOpen, setReviewOpen,
    viewMode, setViewMode,
    filtered, totalPages, paginated,
    handleApprove, handleDecline, openReview,
    // unpaid
    unpaidSearch, setUnpaidSearch,
    unpaidPage, setUnpaidPage,
    unpaidViewMode, setUnpaidViewMode,
    filteredUnpaid, unpaidTotalPages, paginatedUnpaid,
    // unpaid detail
    detailOpen, setDetailOpen,
    liveSelectedUnpaid,
    checkedDues, selectedDues, selectedTotal,
    paymentDate, setPaymentDate,
    toggleDue, toggleAllDues, openUnpaidDetail, handleLogPayment,
    studentProgram,
    // receipt
    receiptOpen, setReceiptOpen, receiptData,
    stats,
  }
}
