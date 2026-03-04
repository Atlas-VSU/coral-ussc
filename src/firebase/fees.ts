import { MemberData } from "@/features/organization/members/types";
import { collection, doc, getDocs, orderBy, query, runTransaction, setDoc, Timestamp, updateDoc, where, writeBatch } from "firebase/firestore";
import { db } from "./firebase.config";
import { FeeGenerationSchema } from "@/features/organization/fees/utils/feeGenerationSchema";
import z from "zod";
import { Fee, PaymentLog } from "@/features/organization/fees/types";
import { getAllStudents } from "./members";
import { setDate } from "date-fns";
import { toast } from "sonner";


export const generateFeesForAllStudents = async (feeData: z.infer<typeof FeeGenerationSchema>, userId: string, eventId?: string) : Promise<void> => {
    const students = await getAllStudents() as unknown as MemberData[];
    if (students.length === 0) {
        throw new Error("No students provided");
    }

    const feesCollection = collection(db, "fees");
    const now = Timestamp.now();

    const chunkSize = 400;
    for(let i=0; i<students.length; i+=chunkSize) {
        const chunk = students.slice(i, i+chunkSize);
        const batch = writeBatch(db);
        
        chunk.forEach(student => {
            const docRef = doc(feesCollection);
            batch.set(docRef, {
                orgId: userId,
                userId: student.id || "",
                userName: `${student.member.firstName} ${student.member.lastName}`,
                studentId: student.member.studentId,
                feeType: feeData.feeType,
                title: feeData.title,
                amount: feeData.amount,
                paidAmount: 0,
                balance: feeData.amount,
                status: "unpaid",
                academicYear: feeData.academicYear,
                semester: feeData.semester,
                description: feeData.description,
                eventId: eventId || null,
                dueDate: feeData.dueDate,
                isRequiredForClearance: feeData.isRequiredForClearance,
                createdBy: userId,
                createdAt: now,
                updatedAt: now,
                isArchived: false,
            })
        })
        await batch.commit();
    }
}

export const fetchFeesForOrg = async(orgId: string): Promise<Fee[]> => {
    try {
        const feesRef = collection(db, "fees");

        const q = query(
            feesRef,
            where("orgId", "==", orgId),
            where("isArchived", "==", false),
            orderBy("createdAt", "desc")
        )

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as unknown as Fee[];
    } catch (error) {
        console.error("Error fetching fees for org:", error);
        return [];
    }
}


export async function fetchFeeRoster(title: string, academicYear: string) {
  try {
    const feesRef = collection(db, "fees");
    
    // Querying by both title and academicYear ensures accuracy
    const rosterQuery = query(
      feesRef,
      where("title", "==", title),
      where("academicYear", "==", academicYear)
    );

    const snapshot = await getDocs(rosterQuery);
    
    const roster = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return roster;
  } catch (error) {
    console.error("Error fetching roster:", error);
    return [];
  }
}

export async function fetchPaymentLogs(feeId: string) {
    try {
        const logsRef = collection(db, "fees", feeId, "payment_history");
        const q = query(logsRef, orderBy("paid_at", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching payment logs:", error);
        return [];
    }
}

export const recordManualPayment = async (feeId: string, amount: string, method: "gcash" | "cash" | "bank_transfer" | "waiver", userId: string, ref?: string) => {
    try {
        if (!feeId) {
            console.error("Missing feeId! The function received:", { feeId, amount, method, userId });
            throw new Error("Cannot record payment: feeId is missing.");
        }

        const paymentAmount = parseFloat(amount);
        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            throw new Error("Invalid payment amount");
        }

        const feeRef = doc(db, "fees", feeId);
        const subCollectionRef = collection(feeRef, "payment_history");
        const newLogRef = doc(subCollectionRef);
        await runTransaction(db, async (transaction) => {
            const feeDoc = await transaction.get(feeRef);

            if (!feeDoc.exists()) {
                throw new Error(`Fee documenty with ID ${feeId} does not exist.`);
            }

            const feeData = feeDoc.data() as Fee;

            const currentPaidAmount = feeData.paidAmount || 0;
            const totalRequiredAmount = feeData.amount || 0;

            const newPaidAmount = currentPaidAmount + paymentAmount;
            const newBalance = Math.max(0, totalRequiredAmount - newPaidAmount);
            let newStatus = "pending";
            if (newBalance <= 0) {
                newStatus = "paid";
            } else if (newPaidAmount > 0) {
                newStatus = "partial";
            }

            const newLog: PaymentLog = {
                id: newLogRef.id,
                payment_number: Date.now(), 
                amount: paymentAmount,
                payment_method: method,
                payment_proof_id: null,
                gcash_reference: method === "gcash" && ref ? ref : null,
                status: "verified",
                paid_at: Timestamp.now(),
                verified_by: userId, 
                verified_at: Timestamp.now(),
                rejection_reason: null,
                notes: "Manual payment recorded by admin",
                metadata: null,
                created_at: Timestamp.now(),
            };

            transaction.set(newLogRef, newLog);
            
            transaction.update(feeRef, {
                paidAmount: newPaidAmount,
                balance: newBalance,
                status: newStatus,
            });
        })
        console.log("Manual payment recorded successfully");
        console.log(newLogRef.id);
        return newLogRef.id;
    } catch (error) {
        console.error("Error approving manual payment:", error);
        throw error;
    }
}
