import { db } from "@/firebase/firebase.config";
import { addDoc, collection, getCountFromServer, Timestamp } from "firebase/firestore";
import { getProofOfPaymentById } from "../read/proofOfPayment";
import { updateProofOfPaymentHistoryId } from "../update/proofOfPayment";
import { getCurrentUserData } from "@/firebase/users";
import { Member, MemberData } from "@/features/organization/members/types";
import { recalculateFines } from "@/firebase/fines/update/recalculate";
import { markFineItemsAsPaid } from "@/firebase/fines/update/fineItemsStatus";
import { PaymentMethod } from "@/features/organization/fees/types";
import { StudentFines } from "@/features/organization/fines/types";
import { PaymentFormData } from "@/lib/validators";
import { createOfflineProofOfPayment } from "./proofOfPayment";
import { PaymentStatus } from "@/constants/status";
import { PaymentMethods, PaymentType } from "@/constants/types";



export const addOnlinePayment = async (proofOfPaymentId: string) => {
    try {
        const payment = await getProofOfPaymentById(proofOfPaymentId);
        if (!payment) {
            throw new Error("Proof of payment not found.");
        }
        const subColRef = collection(db, payment!.paymentType, payment!.referenceId, "paymentHistory");
        const querySnapshot = await getCountFromServer(subColRef);
        let sequenceNumber = 0;
        querySnapshot.data().count ? sequenceNumber = querySnapshot.data().count + 1: sequenceNumber = 1;

        const paymentHistory = await addDoc(subColRef, {
            paymentNumber: sequenceNumber,
            amount: payment.amount,
            paymentMethod: PaymentMethods.GCASH, // Assuming all online payments are through GCash. Since mao ni ang girequire na data sa fields
            paymentProofId: proofOfPaymentId,
            gcashReference: payment.referenceNumber,
            status: PaymentStatus.PENDING,
            paidAt: payment.submittedAt, 
            notes: `Payment of ${payment.amount} submitted for ${payment.paymentType} with reference ID ${payment.referenceId}.`,
            metaData: {
                createdAt: Timestamp.now(),
            }
        });
        await updateProofOfPaymentHistoryId(proofOfPaymentId,paymentHistory.id);
    } catch (error) {
        console.error("Error adding payment history:", error);
        throw new Error("Failed to add payment history. Please try again.");
    }
}

export const addOfflinePayment = async (fines: StudentFines, type:string, method: PaymentMethod, payRef?: string, senderNumber?:string) => {
    const currentUser = await getCurrentUserData() as unknown as Member;
    try {
        const subColRef = collection(db, type, fines.id!, "paymentHistory");
        const querySnapshot = await getCountFromServer(subColRef);

        let sequenceNumber = 0;
        querySnapshot.data().count ? sequenceNumber = querySnapshot.data().count + 1: sequenceNumber = 1;
        const proof = {
            userName: fines.userName,
            studentId: fines.studentId,
            amount: fines.balance,
            paymentMethod: method,
            referenceNumber: payRef || "",
            senderNumber: senderNumber || "",
            imageUrl: "",
            rejectionReason: "",
            notes: "",
        } as PaymentFormData;

        const proofId = await createOfflineProofOfPayment(proof, type);

        const paymentHist = await addDoc(subColRef, {
            paymentNumber: sequenceNumber,
            amount: fines.balance,
            paymentMethod: method,
            paymentProofId: proofId,
            gcashReference: payRef || null,
            status:PaymentStatus.VERIFIED,
            paidAt: Timestamp.now(), 
            verifiedBy: currentUser.firstName + " " + currentUser.lastName,
            verifiedAt: Timestamp.now(),
            rejectionReason: null,
            notes: `Offline payment of ${fines.balance} recorded for ${type}`,
            metaData: {},
            createdAt: Timestamp.now(),
        });
            await updateProofOfPaymentHistoryId(proofId!, paymentHist.id)
        if (type === PaymentType.FINES) {
            await recalculateFines(fines.id!, null, fines.balance);
            await markFineItemsAsPaid(fines.id!);
        }
    } catch (error) {
        console.error("Error adding offline payment history:", error);
        throw new Error("Failed to add offline payment history. Please try again.");
    }
}



