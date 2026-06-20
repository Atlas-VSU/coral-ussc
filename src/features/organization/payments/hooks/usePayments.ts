import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProofOfPayment } from "../../fines/types";
import { fetchClearanceDocumentsPaginated, getCountOfUnclearedDocuments, getCurrentUserData } from "@/firebase";
import { getProofOfPaymentsCount, getProofOfPaymentsPaginated } from "@/firebase/payment/read/proofOfPayment";
import { toast } from "sonner";
import { cacheService, CACHE_KEYS } from "@/services/cacheService";
import { Member } from "../../members/types";
import { ClearanceStatus } from "../../clearance/types";
import { ITEMS_PER_PAGE } from "../config";
import { getActiveTerm } from "@/firebase/term";
import { useTermPeriod } from "../../term/hooks/useTermPeriod";

export function usePayments() {
  const [payments, setPayments] = useState<ProofOfPayment[]>([])
  const [unpaidPayments, setUnpaidPayments] = useState<ClearanceStatus[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(true)
  const [loadingUnpaid, setLoadingUnpaid] = useState(true)

  const { selected } = useTermPeriod();
  
  const [totalUnpaidCount, setTotalUnpaidCount] = useState(0)
  const [totalSubmissionCount, setTotalSubmissionCount] = useState(0)
  
  // ── Refs — Pure Next/Prev Cursors ─────────────────────────────────────────
  const submissionsCursorsRef = useRef<Record<number, any>>({});
  const unpaidCursorsRef = useRef<Record<number, any>>({});
  const currentOrgIdRef = useRef<string | null>(null)
  const fetchRequestIdRef = useRef(0)
  const unpaidRequestIdRef = useRef(0)
  
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
    const cacheKey = `payments:stats:${orgId}:${selected?.AY}-${selected?.semester}`;
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
        getProofOfPaymentsCount(orgId, "pending", selected),
        getProofOfPaymentsCount(orgId, "verified", selected),
        getProofOfPaymentsCount(orgId, "rejected", selected)
      ]);
      
      const newStats = { pending, approved, declined };
      cacheService.set(cacheKey, newStats, 5 * 60 * 1000); // 5 minute cache
      setStats(prev => ({ ...prev, ...newStats }));
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  }, [selected]);

  // ── Fetch proof of payments ───────────────────────────────────────────────
  const fetchPayments = useCallback(async () => {
    const requestId = ++fetchRequestIdRef.current;
    setLoadingSubmissions(true);

    try {
      const currentUser = await getCurrentUserData() as unknown as Member;
      if (requestId !== fetchRequestIdRef.current) return;
      if (!currentUser?.id) return;
      
      currentOrgIdRef.current = currentUser.orgId!;
      fetchStats(currentUser.orgId!); // Trigger stats fetch safely

      // Retrieve the cursor for the current page
      const cursor = submissionPage > 1 
        ? (submissionsCursorsRef.current[submissionPage - 2] ?? null) 
        : null;

      const { docs, count, lastVisible } = await getProofOfPaymentsPaginated(
        currentUser.orgId!,
        ITEMS_PER_PAGE,
        cursor,
        search,
        filterStatus, 
        !!search,
        selected
      );

      if (requestId !== fetchRequestIdRef.current) return;
      
      const actualCount = search ? count : await getProofOfPaymentsCount(currentUser.orgId!, filterStatus, selected);
      if (requestId !== fetchRequestIdRef.current) return;

      setTotalSubmissionCount(actualCount);
      setPayments(docs);
      setSearchCount(count);

      // Persist cursor
      if (lastVisible) {
        submissionsCursorsRef.current[submissionPage - 1] = lastVisible;
      }
      
    } catch (error) {
      if (requestId === fetchRequestIdRef.current) {
        toast.error("Could not load submitted payments.");
        console.error(error);
      }
    } finally {
      if (requestId === fetchRequestIdRef.current) {
        setLoadingSubmissions(false);
      }
    }
  }, [submissionPage, search, filterStatus, fetchStats, selected]);

  useEffect(() => { 
    fetchPayments();
  }, [fetchPayments]);

  // ── Fetch Unpaid Records ──────────────────────────────────────────────────
  const fetchUnpaid = useCallback(async () => {
    const requestId = ++unpaidRequestIdRef.current;
    setLoadingUnpaid(true);

    try {
      const currentUser = await getCurrentUserData() as unknown as Member;
      if (requestId !== unpaidRequestIdRef.current) return;
      if (!currentUser?.id) return;
      
      currentOrgIdRef.current = currentUser.orgId!;

      // Retrieve cursor for unpaid
      const cursor = unpaidPage > 1 
        ? (unpaidCursorsRef.current[unpaidPage - 2] ?? null) 
        : null;
      
      const { docs, count, lastVisible } = await fetchClearanceDocumentsPaginated(
        currentUser.orgId!,
        ITEMS_PER_PAGE,
        cursor,
        unpaidSearch,
        "not_cleared",
        !!unpaidSearch,
        true,
        selected
      );
      
      if (requestId !== unpaidRequestIdRef.current) return;

      const actualUnpaidCount = unpaidSearch ? count : await getCountOfUnclearedDocuments(currentUser.orgId!, selected);
      if (requestId !== unpaidRequestIdRef.current) return;

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
      if (requestId === unpaidRequestIdRef.current) {
        toast.error("Could not load unpaid payments.");
        console.error(error);
      }
    } finally {
      if (requestId === unpaidRequestIdRef.current) {
        setLoadingUnpaid(false);
      }
    }
  }, [unpaidPage, unpaidSearch, selected]);

  useEffect(() => { 
    fetchUnpaid();
  }, [fetchUnpaid]);


  // ── Hard refresh ──────────────────────────────────────────────────────────
  const hardRefreshSubmissions = useCallback(async () => {
    if (isRefreshingSubmissions) return;
    setIsRefreshingSubmissions(true);

    try {
      const currentUser = await getCurrentUserData() as unknown as Member;
      if (currentUser) {
        cacheService.invalidate(CACHE_KEYS.proofOfPayments(currentUser.orgId!));
        cacheService.invalidate(`payments:stats:${currentUser.orgId}`);
        cacheService.invalidateByPrefix('payments:proof:')
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
      const currentUser = await getCurrentUserData() as unknown as Member;
      if (currentUser) {
        cacheService.invalidate(CACHE_KEYS.finesUnpaid(currentUser.orgId!));
        cacheService.invalidate(CACHE_KEYS.feesUnpaid(currentUser.orgId!));
        cacheService.invalidate(CACHE_KEYS.clearanceAll(currentUser.orgId!));
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
    AY: selected?.AY || "",
    sem: selected?.semester || "",
  }
}