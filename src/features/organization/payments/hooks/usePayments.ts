import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProofOfPayment } from "../../fines/types";
import { fetchClearanceDocumentsPaginated, getCountOfUnclearedDocuments, getCurrentUserData } from "@/firebase";
import { getProofOfPaymentsCount, getProofOfPaymentsPaginated } from "@/firebase/payment/read/proofOfPayment";
import { toast } from "sonner";
import { cacheService, CACHE_KEYS } from "@/services/cacheService";
import { Member } from "../../members/types";
import { ClearanceStatus } from "../../clearance/types";

export function usePayments() {
  const [payments, setPayments] = useState<ProofOfPayment[]>([])
  const [unpaidPayments, setUnpaidPayments] = useState<ClearanceStatus[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(true)
  const [loadingUnpaid, setLoadingUnpaid] = useState(true)
  
  const [totalUnpaidCount, setTotalUnpaidCount] = useState(0)
  const [totalSubmissionCount, setTotalSubmissionCount] = useState(0)
  
  // ── Refs — Pure Next/Prev Cursors ─────────────────────────────────────────
  const submissionsCursorsRef = useRef<Record<number, any>>({});
  const unpaidCursorsRef = useRef<Record<number, any>>({});
  const currentOrgIdRef = useRef<string | null>(null)
  
  const [unpaidPage, setUnpaidPage] = useState(1)
  const [submissionPage, setSubmissionPage] = useState(1)
  
  const [search, setSearch] = useState("")
  const [searchCount, setSearchCount] = useState(0)
  const [unpaidSearch, setUnpaidSearch] = useState("")
  const [unpaidSearchCount, setUnpaidSearchCount] = useState(0)
  const [filterStatus, setFilterStatus] = useState<string>("all")

  // Refresh locks to prevent spam
  const [isRefreshingSubmissions, setIsRefreshingSubmissions] = useState(false)
  const [isRefreshingUnpaid, setIsRefreshingUnpaid] = useState(false)

  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    declined: 0,
    unpaid: 0,
  })

  // ── Stats (Isolated and Cached) ───────────────────────────────────────────
  const fetchStats = useCallback(async (orgId: string) => {
    const cacheKey = `payments:stats:${orgId}`;
    const cached = cacheService.get(cacheKey);
    
    if (cached !== null && cached !== undefined) {
       // Extract data to prevent the React Object render crash
       const statsData = typeof cached === 'object' && 'data' in (cached as any) 
         ? (cached as any).data 
         : cached;
       setStats(prev => ({ ...prev, ...statsData }));
       return;
    }

    try {
      const [pending, approved, declined] = await Promise.all([
        getProofOfPaymentsCount(orgId, "pending"),
        getProofOfPaymentsCount(orgId, "verified"),
        getProofOfPaymentsCount(orgId, "rejected")
      ]);
      
      const newStats = { pending, approved, declined };
      cacheService.set(cacheKey, newStats, 5 * 60 * 1000); // 5 minute cache
      setStats(prev => ({ ...prev, ...newStats }));
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  }, []);

  // ── Fetch proof of payments ───────────────────────────────────────────────
  const fetchPayments = useCallback(async () => {
    setLoadingSubmissions(true);
    const itemsPerPage = 10;

    try {
      const currentUser = await getCurrentUserData() as unknown as Member;
      console.log(currentUser);
      if (!currentUser?.id) return;
      
      currentOrgIdRef.current = currentUser.id;
      fetchStats(currentUser.id); // Trigger stats fetch safely

      // Retrieve the cursor for the current page
      const cursor = submissionPage > 1 
        ? (submissionsCursorsRef.current[submissionPage - 2] ?? null) 
        : null;

      const { docs, count, lastVisible } = await getProofOfPaymentsPaginated(
        currentUser.id,
        itemsPerPage,
        cursor,
        search,
        filterStatus, 
        !!search
      );
      
      setTotalSubmissionCount(search ? count : await getProofOfPaymentsCount(currentUser.id, filterStatus));
      setPayments(docs);
      setSearchCount(count);

      // Persist cursor
      if (lastVisible) {
        submissionsCursorsRef.current[submissionPage - 1] = lastVisible;
      }
      
    } catch (error) {
      toast.error("Could not load submitted payments.");
      console.error(error);
    } finally {
      setLoadingSubmissions(false);
    }
  }, [submissionPage, search, filterStatus, fetchStats]);

  useEffect(() => { 
    fetchPayments();
  }, [fetchPayments]);

  // ── Fetch Unpaid Records ──────────────────────────────────────────────────
  const fetchUnpaid = useCallback(async () => {
    setLoadingUnpaid(true);
    const itemsPerPage = 10;

    try {
      const currentUser = await getCurrentUserData() as unknown as Member;
      if (!currentUser?.id) return;
      
      currentOrgIdRef.current = currentUser.id;

      // Retrieve cursor for unpaid
      const cursor = unpaidPage > 1 
        ? (unpaidCursorsRef.current[unpaidPage - 2] ?? null) 
        : null;
      
      // Note: Assuming fetchClearanceDocumentsPaginated returns 'lastVisible' 
      // instead of or alongside 'allSnapshots' now
      const { docs, count, lastVisible } = await fetchClearanceDocumentsPaginated(
        currentUser.id,
        itemsPerPage,
        cursor,
        unpaidSearch,
        "not_cleared",
        !!unpaidSearch,
        true
      );
      
      const actualUnpaidCount = unpaidSearch ? count : await getCountOfUnclearedDocuments(currentUser.id);
      setTotalUnpaidCount(actualUnpaidCount);
      
      // Keep stats in sync with total unpaid
      setStats(prev => ({ ...prev, unpaid: actualUnpaidCount }));
      
      setUnpaidPayments(docs);
      setUnpaidSearchCount(count);

      // Persist cursor
      if (lastVisible) {
        unpaidCursorsRef.current[unpaidPage - 1] = lastVisible;
      }
      
    } catch (error) {
      toast.error("Could not load unpaid payments.");
      console.error(error);
    } finally {
      setLoadingUnpaid(false);
    }
  }, [unpaidPage, unpaidSearch]);

  useEffect(() => { 
    fetchUnpaid();
  }, [fetchUnpaid]);


  // ── Hard refresh ──────────────────────────────────────────────────────────
  const hardRefreshSubmissions = useCallback(async () => {
    if (isRefreshingSubmissions) return;
    setIsRefreshingSubmissions(true);

    try {
      const currentUser = await getCurrentUserData();
      if (currentUser) {
        cacheService.invalidate(CACHE_KEYS.proofOfPayments(currentUser.uid));
        cacheService.invalidate(`payments:stats:${currentUser.uid}`);
      }
      
      // Wipe ONLY the current page's cursor to force a fresh fetch of this view
      submissionsCursorsRef.current[submissionPage - 1] = undefined;
      await fetchPayments();
    } finally {
      setIsRefreshingSubmissions(false);
    }
  }, [isRefreshingSubmissions, submissionPage, fetchPayments]);

  const hardRefreshUnpaid = useCallback(async () => {
    if (isRefreshingUnpaid) return;
    setIsRefreshingUnpaid(true);

    try {
      const currentUser = await getCurrentUserData();
      if (currentUser) {
        cacheService.invalidate(CACHE_KEYS.finesUnpaid(currentUser.uid));
        cacheService.invalidate(CACHE_KEYS.feesUnpaid(currentUser.uid));
        cacheService.invalidate(CACHE_KEYS.clearanceAll(currentUser.uid));
      }
      
      unpaidCursorsRef.current[unpaidPage - 1] = undefined;
      await fetchUnpaid();
    } finally {
      setIsRefreshingUnpaid(false);
    }
  }, [isRefreshingUnpaid, unpaidPage, fetchUnpaid]);


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
    isLoading: loadingSubmissions,
    isLoadingUnpaid: loadingUnpaid,
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
    stats, 
    setStats,
  }
}