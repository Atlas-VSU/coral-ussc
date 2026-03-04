import { MemberData } from "@/features/organization/members/types";
import { collection, doc, getDocs, orderBy, query, Timestamp, where, writeBatch } from "firebase/firestore";
import { db } from "./firebase.config";
import { FeeGenerationSchema } from "@/features/organization/fees/utils/feeGenerationSchema";
import z from "zod";
import { Fee } from "@/features/organization/fees/types";
import { getAllStudents } from "./members";


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
        const logsRef = collection(db, "fees", feeId, "payment_log");
        const q = query(logsRef, orderBy("createdAt", "desc"));
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