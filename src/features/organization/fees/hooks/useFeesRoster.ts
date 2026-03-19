import { useCallback, useEffect, useState } from "react";
import { fetchFee, fetchFeeRoster, fetchPaymentLogs } from "@/firebase/fees";
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

export function useFeesRoster(title: string, academicYear: string) {
    const [fee, setFee] = useState<BaseFeeData | null>(null);
    const [studentRows, setStudentRows] = useState<StudentFeeRow[]>([]);
    const [students, setStudents] = useState<Member[]>([]);
    const [logs, setLogs] = useState<PaymentLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchFeesData = useCallback(async () => {
        if (!title || !academicYear) return;

        setIsLoading(true);
        setError(null);

        try {
            const fetchedFees = await fetchFeeRoster(title, academicYear) as (Fee & { id: string })[];
            
            if (fetchedFees.length > 0) {
                const referenceDoc = fetchedFees[0];
                setFee({
                    id: referenceDoc.id,
                    title: referenceDoc.title,
                    academicYear: referenceDoc.academicYear,
                    semester: referenceDoc.semester,
                    amount: referenceDoc.amount,
                    description: referenceDoc.description,
                    dueDate: referenceDoc.dueDate,
                    feeType: referenceDoc.feeType,
                    createdBy: referenceDoc.createdBy,
                    orgId: referenceDoc.orgId
                });
                
                const connectedRowsPromises = fetchedFees.map(async (f) => {
                    const feeLogs = await fetchPaymentLogs(f.id) as PaymentLog[];
                    
                    const enrichedLogs = feeLogs.map(log => ({
                        ...log,
                        feeId: f.id,
                        userId: f.userId,
                        status: log.status,
                        studentId: f.studentId,
                        studentName: f.userName,
                    }));

                    const memberInfo: Partial<Member> = {
                        id: f.userId,
                        studentId: f.studentId,
                        firstName: f.userName.split(' ')[0],
                        lastName: f.userName.split(' ').slice(1).join(' '),
                        role: "user",
                    };

                    return {
                        ...f,
                        memberInfo,
                        logs: enrichedLogs
                    } as StudentFeeRow;
                });

                const resolvedRows = await Promise.all(connectedRowsPromises);
                setStudentRows(resolvedRows);

                setStudents(resolvedRows.map(row => row.memberInfo as Member));
                setLogs(resolvedRows.flatMap(row => row.logs)); 

            } else {
                setFee(null);
                setStudentRows([]);
                setStudents([]);
                setLogs([]);
            }
        } catch (err) {
            console.error("Error fetching fees roster:", err);
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, [title, academicYear]);

    const hardRefresh = useCallback(async () => {
        const user = await getCurrentUserData();
        if (user && title && academicYear) {
            cacheService.invalidate(CACHE_KEYS.feeRoster(user.uid, title, academicYear));
        }
        await fetchFeesData();
    }, [title, academicYear, fetchFeesData]);

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
                
                const enrichedLogs = (freshLogs as PaymentLog[]).map(log => ({
                    ...log,
                    feeId: rowToUpdate.id,
                    userId: rowToUpdate.userId,
                    status: log.status,
                    studentId: rowToUpdate.studentId,
                    studentName: rowToUpdate.userName,
                    type: rowToUpdate.feeType,
                    amount: log.amount,
                }));

                const updatedRow = {
                    ...rowToUpdate,
                    ...updatedFee,
                    logs: enrichedLogs
                };

                const newRows = [...prevRows];
                newRows[rowIndex] = updatedRow;

                setLogs(newRows.flatMap(row => row.logs));
                newRows.sort((a, b) => b.updatedAt?.toMillis() - a.createdAt.toMillis());
                return newRows;
            });
        } catch (err) {
            console.error(`Error refetching row for feeId ${feeId}:`, err);
        }
    }, []);


    useEffect(() => {
        fetchFeesData();
    }, [fetchFeesData]);


    return { 
        fee, 
        studentRows, 
        students, 
        logs, 
        isLoading, 
        error,
        refetchStudentRow,
        refetch: hardRefresh
    };
}