// usePayments.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProofOfPayment, StudentFines } from "../../fines/types";
import { fetchClearanceDocumentsPaginated, getCountOfUnclearedDocuments, getCurrentUserData, getUserById } from "@/firebase";
import { getAllProofOfPayments } from "@/firebase/payment/read/proofOfPayment";
import { toast } from "sonner";
import { Fee } from "../../fees/types";
import { StudentFineItem, StudentUnpaidRecord, UnpaidDue } from "../types";
import { cacheService, CACHE_KEYS } from "@/services/cacheService";
import { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { Member } from "../../members/types";
import { ClearanceStatus } from "../../clearance/types";

interface ClearanceWithStudent {
  cl: ClearanceStatus
  student: Member
}

// ── Pure converter — outside hook, no deps ────────────────────────────────
const toUnpaidRecord = ({ cl, student }: ClearanceWithStudent): StudentUnpaidRecord | null => {
  const dues: UnpaidDue[] = Object.entries(cl.blockingItems || {})
    .filter(([_, item]) => item.status === "unpaid" && !item.pendingReview)
    .map(([_, item]) => {
      const isFine = item.type === "fines"
      return {
        id: item.referenceId,
        type: isFine ? "fines" as const : "fees" as const,
        name: item.title,
        item: isFine
          ? {
              refId: item.referenceId,
              userId: cl.userId,
              fine: {} as StudentFines,
              parentFineId: item.parentFineId!,
              title: item.title,
              amount: item.balance,
            } as StudentFineItem
          : {
              id: item.referenceId,
              userId: cl.userId,
              title: item.title,
              amount: item.balance,
              paidAmount: 0,
            } as unknown as Fee,
        balance: item.balance,
        parentId: item.parentFineId ?? item.referenceId,
      }
    })

  if (dues.length === 0) return null
  return { student, dues }
}

// ── Shared helper — fetch users in parallel then build records ────────────
const buildRecords = async (docs: ClearanceStatus[]): Promise<StudentUnpaidRecord[]> => {
  const users = await Promise.all(docs.map(d => getUserById(d.userId)))
  return docs
    .map((cl, i) => users[i] ? toUnpaidRecord({ cl, student: users[i]! }) : null)
    .filter(Boolean) as StudentUnpaidRecord[]
}

export function usePayments() {
  const [payments, setPayments] = useState<ProofOfPayment[]>([])
  const [unpaidPayments, setUnpaidPayments] = useState<StudentUnpaidRecord[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(true)
  const [loadingUnpaid, setLoadingUnpaid] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [unpaidHasMore, setUnpaidHasMore] = useState(false)
  const [totalUnpaidCount, setTotalUnpaidCount] = useState(0)
  // ── Refs — avoid stale closures ───────────────────────────────────────────
  const lastVisibleDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null)
  const currentOrgIdRef = useRef<string | null>(null)
  // Track current search/filter so loadMore knows what query it's continuing
  const currentSearchRef = useRef<string>("")

  const isLoading = loadingSubmissions
  const isLoadingUnpaid = loadingUnpaid

  // ── Fetch proof of payments ───────────────────────────────────────────────
  const loadPayments = useCallback(async () => {
    setLoadingSubmissions(true)
    try {
      const currentUser = await getCurrentUserData()
      if (!currentUser) throw new Error("Not Authenticated!")
      const data = await getAllProofOfPayments(currentUser.uid)
      setPayments(data.sort((a, b) => b.submittedAt.toMillis() - a.submittedAt.toMillis()))
    } catch (error) {
      toast.error("Could not load payments at this time.")
      console.error(error)
    } finally {
      setLoadingSubmissions(false)
    }
  }, [])

  // ── Core fetch — used for initial load, search, and refresh ──────────────
  // reset=true → replaces list (new search or refresh)
  // reset=false → appends (load more)
  const fetchUnpaid = useCallback(async (
    search: string = "",
    reset: boolean = true,
  ) => {
    const currentUser = await getCurrentUserData() as unknown as Member
    if (!currentUser) return

    currentOrgIdRef.current = currentUser.id!
    currentSearchRef.current = search

    if (reset) {
      setLoadingUnpaid(true)
      lastVisibleDocRef.current = null
    } else {
      setIsFetchingMore(true)
    }

    try {
      const { docs, lastVisible, hasMore } = await fetchClearanceDocumentsPaginated(
        currentUser.id!,
        10,
        reset ? null : lastVisibleDocRef.current,
        search,
        "not_cleared",
      )
      setTotalUnpaidCount(await getCountOfUnclearedDocuments(currentUser.id!))

      lastVisibleDocRef.current = lastVisible
      setUnpaidHasMore(hasMore)

      const records = await buildRecords(docs)

      if (reset) {
        setUnpaidPayments(records)
      } else {
        setUnpaidPayments(prev => [...prev, ...records])
      }
    } catch (error) {
      toast.error(reset ? "Could not load unpaid payments." : "Could not load more unpaid payments.")
      console.error(error)
    } finally {
      if (reset) setLoadingUnpaid(false)
      else setIsFetchingMore(false)
    }
  }, [])

  // ── Load more — continues current search/filter ───────────────────────────
  const loadMoreUnpaid = useCallback(async () => {
    if (!unpaidHasMore || isFetchingMore) return
    await fetchUnpaid(currentSearchRef.current, false)
  }, [unpaidHasMore, isFetchingMore, fetchUnpaid])

  // ── Hard refresh ──────────────────────────────────────────────────────────
  const hardRefresh = useCallback(async () => {
    const currentUser = await getCurrentUserData()
    if (currentUser) {
      cacheService.invalidate(CACHE_KEYS.proofOfPayments(currentUser.uid))
      cacheService.invalidate(CACHE_KEYS.finesUnpaid(currentUser.uid))
      cacheService.invalidate(CACHE_KEYS.feesUnpaid(currentUser.uid))
      cacheService.invalidate(CACHE_KEYS.clearanceAll(currentUser.uid))
    }
    setUnpaidPayments([])
    lastVisibleDocRef.current = null
    setUnpaidHasMore(false)
    await Promise.all([loadPayments(), fetchUnpaid("", true)])
  }, [loadPayments, fetchUnpaid])

  useEffect(() => {
    loadPayments()
    fetchUnpaid("", true)
  }, [loadPayments, fetchUnpaid])

  const pendingPayments  = useMemo(() => payments.filter(p => p.status === "pending"),  [payments])
  const rejectedPayments = useMemo(() => payments.filter(p => p.status === "rejected"), [payments])
  const verifiedPayments = useMemo(() => payments.filter(p => p.status === "verified"), [payments])

  return {
    payments,
    unpaidPayments,
    setUnpaidPayments,
    unpaidHasMore,
    isFetchingMore,
    loadMoreUnpaid,
    fetchUnpaid,       
    pendingPayments,
    rejectedPayments,
    verifiedPayments,
    refetchPayments: hardRefresh,
    isLoading,
    isLoadingUnpaid,
    totalUnpaidCount
  }
}