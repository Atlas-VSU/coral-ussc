import { useCallback, useEffect, useState } from "react";
import { fetchFee, fetchFeesPaginated, getFeesCount, fetchFeeSubmissionsPaginated, fetchPaymentLogs } from "@/firebase/fees";
import { Fee, PaymentLog } from "../types";
import { Member } from "../../members/types";
import { cacheService, CACHE_KEYS } from "@/services/cacheService";
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

    const [fee, setFee] = useState<BaseFeeData | null>(null);
    const [studentRows, setStudentRows] = useState<StudentFeeRow[]>([]);
    const [logs, setLogs] = useState<PaymentLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [lastVisibleDocs, setLastVisibleDocs] = useState<Record<string, any[]>>({
      "all-students": [],
      "submissions": []
    });
    const [stats, setStats] = useState({
      pending: 0,
      verified: 0,
      rejected: 0,
      unpaid: 0
    });

    const fetchData = useCallback(async () => {
        if (!title || !academicYear) return;

        setIsLoading(true);
        setError(null);

        try {
            const user = await getCurrentUserData() as any;
            if (!user?.uid) return;
            const orgId = user.uid;

            // 1. Fetch the reference fee document if not already set
            if (!fee) {
              const { docs: feeDocs } = await fetchFeesPaginated(orgId, title, academicYear, 1);
              if (feeDocs.length > 0) {
                setFee(feeDocs[0]);
              }
            }

            // 2. Fetch data based on dataView
            if (dataView === "all-students") {
                const isJump = currentPage > 1 && !lastVisibleDocs["all-students"][currentPage - 2];
                const effectivePageSize = isJump ? (currentPage * pageSize) : pageSize;
                const effectiveCursor = isJump ? null : (currentPage > 1 ? lastVisibleDocs["all-students"][currentPage - 2] : null);

                const { docs: fetchedDocs, lastVisible, allSnapshots } = await fetchFeesPaginated(
                  orgId, 
                  title, 
                  academicYear, 
                  effectivePageSize, 
                  effectiveCursor, 
                  search, 
                  filterStatus
                );

                const docs = isJump ? fetchedDocs.slice((currentPage - 1) * pageSize) : fetchedDocs;

                const enrichedRows = await Promise.all(docs.map(async (f) => {
                    // For the roster view, we might want the last payment log for each student
                    const feeLogs = await fetchPaymentLogs(f.id) as PaymentLog[];
                    return {
                        ...f,
                        log: feeLogs.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())[0],
                        student: {
                            id: f.userId,
                            studentId: f.studentId,
                            firstName: f.userName.split(' ')[0],
                            lastName: f.userName.split(' ').slice(1).join(' '),
                        },
                        logs: feeLogs
                    } as any;
                }));

                setStudentRows(enrichedRows);
                
                if (allSnapshots && allSnapshots.length > 0) {
                  setLastVisibleDocs(prev => {
                    const nextAll = { ...prev["all-students"] };
                    const next = { ...prev, "all-students": nextAll };
                    
                    allSnapshots.forEach((snap, index) => {
                      const absoluteIndex = isJump ? index : ((currentPage - 1) * pageSize + index);
                      if ((absoluteIndex + 1) % pageSize === 0) {
                        const pageNum = (absoluteIndex + 1) / pageSize;
                        nextAll[pageNum - 1] = snap;
                      }
                    });
                    
                    const finalAbsoluteIndex = isJump ? (allSnapshots.length - 1) : ((currentPage - 1) * pageSize + allSnapshots.length - 1);
                    const finalPageNum = Math.ceil((finalAbsoluteIndex + 1) / pageSize);
                    nextAll[finalPageNum - 1] = allSnapshots[allSnapshots.length - 1];
                    
                    return next;
                  });
                }

            } else {
                // submissions view
                const isJump = currentPage > 1 && !lastVisibleDocs["submissions"][currentPage - 2];
                const effectivePageSize = isJump ? (currentPage * pageSize) : pageSize;
                const effectiveCursor = isJump ? null : (currentPage > 1 ? lastVisibleDocs["submissions"][currentPage - 2] : null);

                const { docs: fetchedDocs, lastVisible, allSnapshots } = await fetchFeeSubmissionsPaginated(
                  orgId, 
                  title, 
                  effectivePageSize, 
                  effectiveCursor,
                  filterStatus,
                  search
                );

                const docs = isJump ? fetchedDocs.slice((currentPage - 1) * pageSize) : fetchedDocs;

                const mappedLogs = (docs as any[]).map(d => ({
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
                // Note: totalCount for submissions should be fetched separately if needed
                // For now we use docs.length or a fixed estimate
                setTotalCount(docs.length > 0 ? (currentPage * pageSize + (docs.length === pageSize ? pageSize : 0)) : (currentPage - 1) * pageSize);

                if (allSnapshots && allSnapshots.length > 0) {
                  setLastVisibleDocs(prev => {
                    const nextSub = { ...prev["submissions"] };
                    const next = { ...prev, "submissions": nextSub };
                    
                    allSnapshots.forEach((snap, index) => {
                      const absoluteIndex = isJump ? index : ((currentPage - 1) * pageSize + index);
                      if ((absoluteIndex + 1) % pageSize === 0) {
                        const pageNum = (absoluteIndex + 1) / pageSize;
                        nextSub[pageNum - 1] = snap;
                      }
                    });
                    
                    const finalAbsoluteIndex = isJump ? (allSnapshots.length - 1) : ((currentPage - 1) * pageSize + allSnapshots.length - 1);
                    const finalPageNum = Math.ceil((finalAbsoluteIndex + 1) / pageSize);
                    nextSub[finalPageNum - 1] = allSnapshots[allSnapshots.length - 1];
                    
                    return next;
                  });
                }
            }

        } catch (err) {
            console.error("Error fetching fees roster:", err);
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, [title, academicYear, dataView, currentPage, pageSize, search, filterStatus, fee]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const hardRefresh = useCallback(async () => {
        const user = await getCurrentUserData();
        if (user && title && academicYear) {
            // Corrected prefix to 'fees:doc:' and added 'fees:logs:'
            cacheService.invalidateByPrefix('fees:doc:');
            cacheService.invalidateByPrefix('fees:logs:');
            // If the roster list itself is cached, it should be cleared too
            cacheService.invalidateByPrefix('fees:roster:');
        }
        setLastVisibleDocs({ "all-students": [], "submissions": [] });
        await fetchData();
    }, [title, academicYear, fetchData]);

    const refetchStudentRow = useCallback(async (feeId: string) => {
        try {
            const [freshLogs, updatedFee] = await Promise.all([
                fetchPaymentLogs(feeId),
                fetchFee(feeId)
            ]);

            if (!updatedFee) return;

            setStudentRows(prevRows => {
                const rowIndex = prevRows.findIndex(row => row.id === feeId);
                if (rowIndex === -1) return prevRows;

                const rowToUpdate = prevRows[rowIndex];
                const updatedRow = {
                    ...rowToUpdate,
                    ...updatedFee,
                    logs: freshLogs as PaymentLog[]

                };

                const newRows = [...prevRows];
                newRows[rowIndex] = updatedRow;
                return newRows;
            });
        } catch (err) {
            console.error(`Error refetching row for feeId ${feeId}:`, err);
        }
    }, []);

    const fetchStatistics = useCallback(async () => {
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


            setStats({
                pending,
                verified,
                rejected,
                unpaid
            });
        } catch (err) {
            console.error("Error fetching statistics:", err);
        }
    }, []);

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
        refetchStudentRow,
        refetch: hardRefresh
    };
}
