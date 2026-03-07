import { PaymentStatus } from "@/constants/status";
import { getFineByStudentId } from "@/firebase/fines/read/fines";
import { db } from "@/firebase/firebase.config";
import { PaymentFormData } from "@/lib/validators";
import { addDoc, collection, Timestamp } from "firebase/firestore";

export const createProofOfPayment = async (
    payment: PaymentFormData, type: string ) => {

    try{
        const transaction = await getFineByStudentId(payment.studentId) ;
        if (transaction)
        {
            const paymentData = {
                ...payment,
                orgId: transaction.orgId,
                userId: transaction.userId,
                referenceId: transaction.id,
                paymentType:type,
                status: PaymentStatus.PENDING,
                submittedAt: Timestamp.now(),
                metaData: {
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                }
            }
            const docRef = await addDoc(collection(db, "proofOfPayments"), paymentData);
            return docRef.id;
        }
        
    }catch{
        throw new Error("Failed to submit proof of payment. Please try again.");
    }
}