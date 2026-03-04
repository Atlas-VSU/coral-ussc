import { useEffect, useState } from "react";
import { fetchFeeRoster, fetchPaymentLogs } from "@/firebase/fees";
import { Fee, PaymentLog } from "../types";
import { Member } from "../../members/types";

export type BaseFeeData = Partial<Fee>;

export function useFeesRoster(title: string, academicYear: string) {
    const [fee, setFee] = useState<BaseFeeData | null>(null);
    const [students, setStudents] = useState<Member[]>([]);
    const [logs, setLogs] = useState<PaymentLog[]>([])
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchFeesData = async () => {
            if (!title || !academicYear) return;

            setIsLoading(true);
            setError(null);

            try {
                const fetchedFees = await fetchFeeRoster(title, academicYear) as unknown as (Fee & { id: string })[];
                
                if (fetchedFees.length > 0) {
                    const referenceDoc = fetchedFees[0];
                    setFee({
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
                    
                    // Transform Fee documents to Member-like objects for the roster view
                    // and fetch logs from subcollections
                    const memberList: Member[] = fetchedFees.map(f => ({
                        id: f.userId,
                        studentId: f.studentId,
                        firstName: f.userName.split(' ')[0] || "",
                        lastName: f.userName.split(' ').slice(1).join(' ') || "",
                        status: f.status === "unpaid" ? "pending" : "approved", // Map fee status to member status loosely
                        role: "student",
                        email: "", // Not available in fee doc
                        programId: "", // Not available in fee doc
                    } as unknown as Member));

                    setStudents(memberList);

                    // Fetch all logs in parallel and attach student info from parent fee
                    const allLogsPromises = fetchedFees.map(async (f) => {
                        const feeLogs = await fetchPaymentLogs(f.id);
                        return feeLogs.map(log => ({
                            ...log,
                            userId: f.userId,
                            studentId: f.studentId,
                            studentName: f.userName,
                        }));
                    });
                    const logsArrays = await Promise.all(allLogsPromises);
                    const flatLogs = logsArrays.flat() as unknown as any[];
                    
                    setLogs(flatLogs);
                } else {
                    setFee(null);
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
    
    return { fee, logs, students, isLoading, error };
}
