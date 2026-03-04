import { useEffect, useState } from "react";
import { fetchFeeRoster, fetchPaymentLogs } from "@/firebase/fees";
import { Fee, PaymentLog } from "../types";
import { Member } from "../../members/types";

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

    useEffect(() => {
        const fetchFeesData = async () => {
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
                            status: f.status,
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
        };

        fetchFeesData();
    }, [title, academicYear]);
    
    return { 
        fee, 
        studentRows, 
        students, 
        logs, 
        isLoading, 
        error 
    };
}