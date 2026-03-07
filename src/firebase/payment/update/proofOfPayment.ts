import { PaymentStatus } from "@/constants/status";
import { ProofOfPayment } from "@/features/organization/fines/types";
import { MemberData } from "@/features/organization/members/types";
import { db } from "@/firebase/firebase.config";
import { getCurrentUserData } from "@/firebase/users";
import { Member } from "@/features/organization/members/types"; // Import Member type
import { doc, Timestamp, updateDoc } from "firebase/firestore";
import { rejectPaymentHistory, verifyPaymentHistory } from "./paymentHistory";


export const updateProofOfPaymentHistoryId = async (proofOfPaymentId: string, paymentHistoryId: string) => {
    try{
        const docRef = doc(db, "proofOfPayments", proofOfPaymentId);
        await updateDoc(docRef, {
            paymentHistoryId: paymentHistoryId,
            "metaData.updatedAt": Timestamp.now(),
        });
    }catch(error){
        console.error("Error updating proof of payment with history ID:", error);
        throw new Error("Failed to update proof of payment. Please try again.");
    }
}

export const verifyPaymentProof = async (proofOfPayment: ProofOfPayment, note: string) => { 
    try { 
        const verifier = await getCurrentUserData() as unknown as Member;
        const docRef = doc(db, "proofOfPayments", proofOfPayment.id!);
        await updateDoc(docRef, {
            verifiedBy: verifier.studentId,
            verifiedByName: verifier.firstName + " " + verifier.lastName,
            verifiedAt: Timestamp.now(),
            notes: note,
            status: PaymentStatus.VERIFIED,
            "metaData.updatedAt": Timestamp.now(),
        });
        await verifyPaymentHistory(proofOfPayment.paymentHistoryId!, proofOfPayment);
        //To Add: email capability
    }catch(error){
        console.error("Error verifying payment proof:", error);
        throw new Error("Failed to verify payment proof. Please try again.");
    }
}

export const rejectPaymentProof = async (proofOfPayment: ProofOfPayment, reason: string) => {
    try { 
        const verifier = await getCurrentUserData() as unknown as Member;
        const docRef = doc(db, "proofOfPayments", proofOfPayment.id!);
        await updateDoc(docRef, {
            verifiedBy: verifier.studentId,
            verifiedByName: verifier.firstName + " " + verifier.lastName,
            verifiedAt: Timestamp.now(),
            rejectionReason: reason,
            status: PaymentStatus.REJECTED,
            "metaData.updatedAt": Timestamp.now(),
        });
        await rejectPaymentHistory(proofOfPayment.paymentHistoryId!, proofOfPayment);
        //To Add: email capability
    }catch(error){
        console.error("Error rejecting payment proof:", error);
        throw new Error("Failed to reject payment proof. Please try again.");
    }
}