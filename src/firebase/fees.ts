import { Member } from "@/features/organization/members/types";
import { collection, doc, Timestamp, writeBatch } from "firebase/firestore";
import { db } from "./firebase.config";
import { FeeGenerationSchema } from "@/features/organization/fees/utils/FeeGenerationSchema";
import z from "zod";


export const generateFeesForAllStudents = async (feeData: z.infer<typeof FeeGenerationSchema>, students: Member[], userId: string, eventId?: string) : Promise<void> => {
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
                user_id: student.id || "",
                user_name: `${student.firstName} ${student.lastName}`,
                student_id: student.studentId,
                fee_type: feeData.feeType,
                title: feeData.title,
                amount: feeData.amount,
                paid_amount: 0,
                balance: feeData.amount,
                status: "unpaid",
                academic_year: feeData.academicYear,
                semester: feeData.semester,
                description: feeData.description,
                event_id: eventId || null,
                due_date: feeData.dueDate,
                is_required_for_clearance: feeData.isRequiredForClearance,
                created_by: userId,
                created_at: now,
                updated_at: now,
                is_archived: false,
            })
        })
        await batch.commit();
    }
}
