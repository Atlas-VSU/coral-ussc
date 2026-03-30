import { cache, useCallback, useEffect, useRef, useState } from "react";
import { fetchFee, fetchFeesPaginated, getFeesCount, fetchFeeSubmissionsPaginated, fetchPaymentLogs, getFeeSubmissionsCount } from "@/firebase/fees";
import { Fee, PaymentLog } from "../types";
import { Member } from "../../members/types";
import { cacheService } from "@/services/cacheService";
import { getCurrentUserData } from "@/firebase";

export type BaseFeeData = Partial<Fee>;

export interface StudentFeeRow extends Fee {
    id: string;
    student: Partial<Member>;
    logs: PaymentLog[];
}

export function useFeesRoster(
  title: string,
  academicYear: string,
  semester: string,
  options: {
    pageSize?: number;
    currentPage?: number;
    search?: string;
    filterStatus?: string;
    dataView?: "submissions" | "all-students";
  } = {}
) {
    const {
      pageSize = 10,
      currentPage = 1,
      search = "",
      filterStatus = "all",
      dataView = "submissions"
    } = options;

    const [fee, setFee] = useState<BaseFeeData | null>(() => {
      try {
        const stash = sessionStorage.getItem(`fee-prefetch:${title}:${academicYear}`)
        if (stash) return JSON.parse(stash) as BaseFeeData
      } catch {}
      return null
    });

    const feeRef = useRef<BaseFeeData | null>(fee);
    useEffect(() => { feeRef.current = fee }, [fee]);

    // Store cursors in a ref — NOT state — so updating them never triggers a re-render
    const cursorsRef = useRef<Record<string, Record<number, any>>>({
      "all-students": {},
      "submissions": {},
    });

    const [studentRows, setStudentRows] = useState<StudentFeeRow[]>([]);
    const [logs, setLogs] = useState<PaymentLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [totalCount, setTotalCount] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [stats, setStats] = useState({
      pending: 0,
      verified: 0,
      rejected: 0,
      unpaid: 0,
    });

    const fetchData = useCallback(async () => {
        if (!title || !academicYear) return;

        setIsLoading(true);
        setError(null);

        try {
            const user = await getCurrentUserData() as any;
            if (!user?.uid) return;
            const orgId = user.uid;

            // Fetch the reference fee document once
            if (!feeRef.current) {
              const { docs: feeDocs } = await fetchFeesPaginated(orgId, title, academicYear, 1);
              if (feeDocs.length > 0) {
                feeRef.current = feeDocs[0];
                setFee(feeDocs[0]);
              }
            }

            // Page 1 has no cursor. Page N uses the stored last-doc of page N-1.
            const cursor = currentPage > 1
              ? (cursorsRef.current[dataView][currentPage - 2] ?? null)
              : null;

            if (dataView === "all-students") {
                const { docs, lastVisible } = await fetchFeesPaginated(
                  orgId,
                  title,
                  academicYear,
                  pageSize,
                  cursor,
                  search,
                  filterStatus
                );

                const enrichedRows: StudentFeeRow[] = await Promise.all(docs.map(async (f) => ({
                    ...f,
                    student: {
                        id: f.userId,
                        studentId: f.studentId,
                        firstName: f.userName.split(' ')[0],
                        lastName: f.userName.split(' ').slice(1).join(' '),
                    },
                    status: f.status,
                    logs: await fetchPaymentLogs(f.id) as PaymentLog[],
                })));

                setStudentRows(enrichedRows);
                setHasNextPage(docs.length === pageSize);
                
                // Persist the cursor for this page so the next page can use it
                if (lastVisible) {
                  cursorsRef.current["all-students"][currentPage - 1] = lastVisible;
                };

            } else {
                const { docs, lastVisible } = await fetchFeeSubmissionsPaginated(
                  orgId,
                  title,
                  academicYear,
                  semester,
                  pageSize,
                  cursor,
                  filterStatus,
                  search
                );

                const mappedLogs: PaymentLog[] = (docs as any[]).map(d => ({
                   id: d.id,
                   paymentProofId: d.id,
                   amount: d.amount,
                   status: d.status,
                   paidAt: d.submittedAt,
                   studentName: d.userName,
                   studentId: d.studentId,
                   paymentMethod: d.paymentMethod,
                   gcashReference: d.referenceNumber,
                   declineRemarks: d.rejectionReason,
                   receiptContent: d.imageUrl,
                   notes: d.notes,
                   reviewedAt: d.verifiedAt,
                   reviewedBy: d.verifiedByName,
                   createdAt: d.submittedAt,
                   type: d.paymentType,
                } as unknown as PaymentLog));

                setLogs(mappedLogs);
                setHasNextPage(docs.length === pageSize);

                if (lastVisible) {
                  cursorsRef.current["submissions"][currentPage - 1] = lastVisible;
                }
            }

        } catch (err) {
            console.error("Error fetching fees roster:", err);
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    // cursorsRef is a ref — safe to omit from deps, it never changes identity
    }, [title, academicYear, dataView, currentPage, pageSize, search, filterStatus]);

    const fetchTotalCount = useCallback(async () => {
        try {
            const user = await getCurrentUserData() as any;
            if (!user?.uid) return;
            const orgId = user.uid;

            if (dataView === "all-students") {
                const count = await getFeesCount(orgId, title, academicYear, semester, filterStatus, search);
                setTotalCount(count);
            } else {
                const count = await getFeeSubmissionsCount(orgId, title, academicYear, semester, filterStatus, search);
                setTotalCount(count);
            }
        } catch (err) {
            console.error("Error fetching total count:", err);
        }
    }, [title, academicYear, filterStatus, search, dataView]);

    useEffect(() => {
        fetchData();
        fetchTotalCount();
    }, [fetchData, fetchTotalCount]);

    // Only wipe the cursor for the current page so we re-fetch just this page
    const hardRefresh = useCallback(async () => {
        const user = await getCurrentUserData();
        if (user && title && academicYear) {
            cacheService.invalidateByPrefix('fees:doc:');
            cacheService.invalidateByPrefix('fees:logs:');
            cacheService.invalidateByPrefix('fees:roster:');
            cacheService.invalidateByPrefix('fees:count:');
            cacheService.invalidateByPrefix('fees:submission-count:');
            cacheService.invalidateByPrefix('fees:stats:');
        }
        cursorsRef.current[dataView][currentPage - 1] = undefined;
        await fetchData();
    }, [title, academicYear, dataView, currentPage, fetchData]);

    const refetchStudentRow = useCallback(async (feeId: string) => {
        try {
            cacheService.invalidateByPrefix('fees:logs:');
            cacheService.invalidateByPrefix('fees:doc:');
            cacheService.invalidateByPrefix('fees:count:');
            cacheService.invalidateByPrefix('fees:submission-count:');
            cacheService.invalidateByPrefix('fees:stats:');
            cacheService.invalidateByPrefix('fees:roster:');
            const [freshLogs, updatedFee] = await Promise.all([
                fetchPaymentLogs(feeId),
                fetchFee(feeId)
            ]);

            if (!updatedFee) return;

            setStudentRows(prevRows => {
                const rowIndex = prevRows.findIndex(row => row.id === feeId);
                if (rowIndex === -1) return prevRows;

                const newRows = [...prevRows];
                newRows[rowIndex] = {
                    ...prevRows[rowIndex],
                    ...updatedFee,
                    logs: freshLogs as PaymentLog[],
                };
                return newRows;
            });
        } catch (err) {
            console.error(`Error refetching row for feeId ${feeId}:`, err);
        }
    }, []);

    const fetchStatistics = useCallback(async () => {
        const cacheKey = `fees:stats:${title}:${academicYear}`;
        const cached = cacheService.get(cacheKey);
        if (cached) { setStats(cached as any); return; }

        try {
            const user = await getCurrentUserData() as any;
            if (!user?.uid) return;
            const orgId = user.uid;

            const [pending, verified, rejected, unpaid] = await Promise.all([
                getFeesCount(orgId, title, academicYear, "pending", ""),
                getFeesCount(orgId, title, academicYear, "paid", ""),
                getFeesCount(orgId, title, academicYear, "rejected", ""),
                getFeesCount(orgId, title, academicYear, "unpaid", "")
            ]);

            const result = { pending, verified, rejected, unpaid };
            cacheService.set(cacheKey, result, 5 * 60 * 1000);
            setStats(result);
        } catch (err) {
            console.error("Error fetching statistics:", err);
        }
    }, [title, academicYear]);

    useEffect(() => {
        fetchStatistics();
    }, [title, academicYear]);

    return {
        fee,
        stats,
        studentRows,
        logs,
        isLoading,
        error,
        totalCount,
        hasNextPage,
        refetchStudentRow,
        refetch: hardRefresh,
    };
}