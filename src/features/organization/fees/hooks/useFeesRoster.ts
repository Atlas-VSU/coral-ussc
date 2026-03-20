import { useCallback, useEffect, useState } from "react";
import { fetchFee, fetchFeesPaginated, getFeesCount, fetchFeeSubmissionsPaginated, fetchPaymentLogs } from "@/firebase/fees";
import { Fee, PaymentLog } from "../types";
import { Member } from "../../members/types";
import { cacheService, CACHE_KEYS } from "@/services/cacheService";
import { getCurrentUserData } from "@/firebase";

export type BaseFeeData = Partial<Fee>;

export interface StudentFeeRow extends Fee {
    id: string; 
    memberInfo: Partial<Member>;
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
                const count = await getFeesCount(orgId, title, academicYear, filterStatus);
                setTotalCount(count);

                const cursor = currentPage > 1 ? lastVisibleDocs["all-students"][currentPage - 2] : null;
                const { docs, lastVisible } = await fetchFeesPaginated(
                  orgId, 
                  title, 
                  academicYear, 
                  pageSize, 
                  cursor, 
                  search, 
                  filterStatus
                );

                const enrichedRows = await Promise.all(docs.map(async (f) => {
                    // For the roster view, we might want the last payment log for each student
                    const feeLogs = await fetchPaymentLogs(f.id) as PaymentLog[];
                    return {
                        ...f,
                        memberInfo: {
                            id: f.userId,
                            studentId: f.studentId,
                            firstName: f.userName.split(' ')[0],
                            lastName: f.userName.split(' ').slice(1).join(' '),
                        },
                        logs: feeLogs
                    } as StudentFeeRow;
                }));

                setStudentRows(enrichedRows);
                if (lastVisible) {
                  setLastVisibleDocs(prev => ({
                    ...prev,
                    "all-students": { ...prev["all-students"], [currentPage - 1]: lastVisible }
                  }));
                }

            } else {
                // submissions view
                // For submissions, we fetch from proofOfPayments
                const { docs, lastVisible } = await fetchFeeSubmissionsPaginated(
                  orgId, 
                  title, 
                  pageSize, 
                  currentPage > 1 ? lastVisibleDocs["submissions"][currentPage - 2] : null,
                  filterStatus
                );

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
                   createdAt: d.submittedAt,
                } as unknown as PaymentLog));

                setLogs(mappedLogs);
                // Note: totalCount for submissions should be fetched separately if needed
                // For now we use docs.length or a fixed estimate
                setTotalCount(docs.length > 0 ? (currentPage * pageSize + (docs.length === pageSize ? pageSize : 0)) : (currentPage - 1) * pageSize);

                if (lastVisible) {
                  setLastVisibleDocs(prev => ({
                    ...prev,
                    "submissions": { ...prev["submissions"], [currentPage - 1]: lastVisible }
                  }));
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
            cacheService.invalidateByPrefix('fee:doc:');
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

    return { 
        fee, 
        studentRows, 
        logs, 
        isLoading, 
        error,
        totalCount,
        refetchStudentRow,
        refetch: hardRefresh
    };
}