
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProofOfPayment, StudentFines } from "../../fines/types";
import { fetchClearanceDocumentsPaginated, getCountOfUnclearedDocuments, getCurrentUserData, getUserById } from "@/firebase";
import { getProofOfPaymentsCount, getProofOfPaymentsPaginated } from "@/firebase/payment/read/proofOfPayment";
import { toast } from "sonner";
import { Fee } from "../../fees/types";
import { StudentFineItem, StudentUnpaidRecord, UnpaidDue } from "../types";
import { cacheService, CACHE_KEYS } from "@/services/cacheService";
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
  const [totalUnpaidCount, setTotalUnpaidCount] = useState(0)
  const [totalSubmissionCount, setTotalSubmissionCount] = useState(0)
  // ── Refs — avoid stale closures ───────────────────────────────────────────
  const [lastVisibleDocs, setLastVisibleDocs] = useState<any[]>([]);
  const currentOrgIdRef = useRef<string | null>(null)
  const [unpaidPage, setUnpaidPage] = useState(1)
  const [submissionPage, setSubmissionPage] = useState(1)
  // Track current search/filter so loadMore knows what query it's continuing
  const [search, setSearch] = useState("")
  const [searchCount, setSearchCount] = useState(0)
  const [unpaidSearch, setUnpaidSearch] = useState("")
  const [unpaidSearchCount, setUnpaidSearchCount] = useState(0)
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    declined: 0,
    unpaid: 0,
  })

  const [submissionsRefreshKey, setSubmissionsRefreshKey] = useState(0) 
  const [unpaidRefreshKey, setUnpaidRefreshKey] = useState(0) 

  const isLoading = loadingSubmissions
  const isLoadingUnpaid = loadingUnpaid

  // // ── Fetch proof of payments ───────────────────────────────────────────────
    useEffect(() => { 
        let isMounted = true;
        const itemsPerPage = 10; 

      const fetchPayments = async (
      ) => {
        setLoadingSubmissions(true);

        try {
          const currentUser = await getCurrentUserData() as unknown as Member
          if (!currentUser) return
          currentOrgIdRef.current = currentUser.id!

          const isJump = submissionPage > 1 && !lastVisibleDocs[submissionPage - 2];
          const effectivePageSize = isJump ? (submissionPage * itemsPerPage) : itemsPerPage;
          const effectiveCursor = isJump ? null : (submissionPage > 1 ? lastVisibleDocs[submissionPage - 2] : null);
          
          const { docs, count, allSnapshots } = await getProofOfPaymentsPaginated(
            currentUser.id!,
            effectivePageSize,
            effectiveCursor,
            search,
            filterStatus, 
            search? true:false
          )
          
          if (isMounted) {
          setTotalSubmissionCount(search ? count : await getProofOfPaymentsCount(currentUser.id!, filterStatus));
          
          const records = isJump?docs.slice((submissionPage - 1) * itemsPerPage) : docs
          setPayments(records)
          setSearchCount(count)

            if (allSnapshots && allSnapshots.length > 0) {
              setLastVisibleDocs(prev => {
                const next = [...prev];
                allSnapshots.forEach((snap, index) => {
                  const absoluteIndex = isJump ? index : ((submissionPage - 1) * itemsPerPage + index);
                  if ((absoluteIndex + 1) % itemsPerPage === 0) {
                    const pageNum = (absoluteIndex + 1) / itemsPerPage;
                    next[pageNum - 1] = snap;
                  }
                });
                const finalAbsoluteIndex = isJump ? (allSnapshots.length - 1) : ((unpaidPage - 1) * itemsPerPage + allSnapshots.length - 1);
                const finalPageNum = Math.ceil((finalAbsoluteIndex + 1) / itemsPerPage);
                next[finalPageNum - 1] = allSnapshots[allSnapshots.length - 1];
                return next;
              });
            }
          } 
          setLoadingSubmissions(false)
        } catch (error) {
          toast.error("Could not load submitted payments.")
          console.error(error)
        } 
        }

        fetchPayments();

        return () => { 
          isMounted = false;
        };
      }, [submissionPage, search, filterStatus, submissionsRefreshKey])

  
  // ── Core fetch — used for initial load, search, and refresh ──────────────
  useEffect(() => { 
    let isMounted = true;
    const itemsPerPage = 10; 

  const fetchUnpaid = async (
  ) => {
    setLoadingUnpaid(true);
    try {
      const currentUser = await getCurrentUserData() as unknown as Member
      if (!currentUser) return
      currentOrgIdRef.current = currentUser.id!

      const isJump = unpaidPage > 1 && !lastVisibleDocs[unpaidPage - 2];
      const effectivePageSize = isJump ? (unpaidPage * itemsPerPage) : itemsPerPage;
      const effectiveCursor = isJump ? null : (unpaidPage > 1 ? lastVisibleDocs[unpaidPage - 2] : null);
      
      const { docs, count, allSnapshots } = await fetchClearanceDocumentsPaginated(
        currentUser.id!,
        effectivePageSize,
        effectiveCursor,
        unpaidSearch,
        "not_cleared",
        unpaidSearch ? true : false,
        true
      )
      
      if (isMounted) {
      setTotalUnpaidCount(unpaidSearch? count : await getCountOfUnclearedDocuments(currentUser.id!));
      
      const records = await buildRecords(isJump?docs.slice((unpaidPage - 1) * itemsPerPage) : docs)
      setUnpaidPayments(records)
      setUnpaidSearchCount(count)

        if (allSnapshots && allSnapshots.length > 0) {
          setLastVisibleDocs(prev => {
            const next = [...prev];
            allSnapshots.forEach((snap, index) => {
              const absoluteIndex = isJump ? index : ((unpaidPage - 1) * itemsPerPage + index);
              if ((absoluteIndex + 1) % itemsPerPage === 0) {
                const pageNum = (absoluteIndex + 1) / itemsPerPage;
                next[pageNum - 1] = snap;
              }
            });
            const finalAbsoluteIndex = isJump ? (allSnapshots.length - 1) : ((unpaidPage - 1) * itemsPerPage + allSnapshots.length - 1);
            const finalPageNum = Math.ceil((finalAbsoluteIndex + 1) / itemsPerPage);
            next[finalPageNum - 1] = allSnapshots[allSnapshots.length - 1];
            return next;
          });
        }
       } 
      setLoadingUnpaid(false)
    } catch (error) {
      toast.error("Could not load unpaid payments.")
      console.error(error)
    } 
    }

    fetchUnpaid();

    return () => { 
      isMounted = false;
    };
  }, [unpaidPage, unpaidSearch, unpaidRefreshKey])


  // ── Hard refresh ──────────────────────────────────────────────────────────
  const hardRefreshSubmissions = useCallback(async () => {
    const currentUser = await getCurrentUserData()
    if (currentUser) {
      cacheService.invalidate(CACHE_KEYS.proofOfPayments(currentUser.uid))
      cacheService.invalidate(CACHE_KEYS.finesUnpaid(currentUser.uid))
      cacheService.invalidate(CACHE_KEYS.feesUnpaid(currentUser.uid))
      cacheService.invalidate(CACHE_KEYS.clearanceAll(currentUser.uid))
    }
    setLastVisibleDocs([])
    setSubmissionPage(1)
    setSubmissionsRefreshKey(prev => prev + 1)
    
  }, [])

    const hardRefreshUnpaid = useCallback(async () => {
    const currentUser = await getCurrentUserData()
    if (currentUser) {
      cacheService.invalidate(CACHE_KEYS.proofOfPayments(currentUser.uid))
      cacheService.invalidate(CACHE_KEYS.finesUnpaid(currentUser.uid))
      cacheService.invalidate(CACHE_KEYS.feesUnpaid(currentUser.uid))
      cacheService.invalidate(CACHE_KEYS.clearanceAll(currentUser.uid))
    }
      setLastVisibleDocs([])
      setUnpaidPage(1)
      setUnpaidRefreshKey(prev => prev + 1)
    
  }, [])


    // ── Stats ─────────────────────────────────────────────────────────────────
  useEffect(() => { 
    async function fetchStats() { 

      const pending = await getProofOfPaymentsCount(currentOrgIdRef.current!, "pending")
      const approved = await getProofOfPaymentsCount(currentOrgIdRef.current!, "verified")
      const declined = await getProofOfPaymentsCount(currentOrgIdRef.current!, "rejected")
      setStats({ pending:pending, approved:approved, declined:declined, unpaid: totalUnpaidCount })
    }
    fetchStats()
  }, [totalUnpaidCount])

  const pendingPayments  = useMemo(() => payments.filter(p => p.status === "pending"),  [payments])
  const rejectedPayments = useMemo(() => payments.filter(p => p.status === "rejected"), [payments])
  const verifiedPayments = useMemo(() => payments.filter(p => p.status === "verified"), [payments])

  return {
    payments,
    unpaidPayments,
    setUnpaidPayments,   
    pendingPayments,
    rejectedPayments,
    verifiedPayments,
    refetchPayments: hardRefreshSubmissions,
    refetchUnpaids: hardRefreshUnpaid,
    isLoading,
    isLoadingUnpaid,
    setTotalUnpaidCount,
    totalUnpaidCount,
    unpaidPage,
    setUnpaidPage,
    search,
    setSearch,
    unpaidSearch,
    setUnpaidSearch,
    unpaidSearchCount,
    searchCount,
    submissionPage,
    setSubmissionPage,
    totalSubmissionCount,
    setTotalSubmissionCount,
    currentOrgIdRef,
    filterStatus,
    setFilterStatus,
    stats, setStats,
  }
}