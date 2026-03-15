
import { ProofOfPayment } from "@/features/organization/fines/types";
import { db } from "@/firebase/firebase.config";
import { getCurrentUserData } from "@/firebase/users";
import { Member } from "@/features/organization/members/types"; // Import Member type
import { collection, doc, Timestamp, updateDoc } from "firebase/firestore";
import { rejectPaymentHistory, verifyPaymentHistory } from "./paymentHistory";
import { PaymentStatus } from "@/constants/status";
import { generateReceiptId } from "@/features/organization/payments/utils";


export const updateProofOfPaymentHistoryId = async (proofOfPaymentId: string, paymentHistoryId: string) => {
    try{
        const docRef = doc(db, "proofOfPayments", proofOfPaymentId);
        await updateDoc(docRef, {
            paymentHistoryId: paymentHistoryId,
            "updatedAt": Timestamp.now(),
        });
    }catch(error){
        console.error("Error updating proof of payment with history ID:", error);
        throw new Error("Failed to update proof of payment. Please try again.");
    }
}

export const verifyPaymentProof = async (proofOfPayment: ProofOfPayment, verifier: Member, receipt?: string) => { 
    try { 
        const docRef = doc(db, "proofOfPayments", proofOfPayment.id!);
        await updateDoc(docRef, {
            verifiedBy: verifier.id,
            verifiedByName: verifier.firstName + " " + verifier.lastName,
            verifiedAt: Timestamp.now(),
            receiptCode: receipt,
            status: PaymentStatus.VERIFIED,
            updatedAt: Timestamp.now(),
        });

        //To Add: email capability
    }catch(error){
        console.error("Error verifying payment proof:", error);
        throw new Error("Failed to verify payment proof. Please try again.");
    }
}

export const rejectPaymentProof = async (proofOfPayment: ProofOfPayment, verifier: Member,  reason?: string) => {
    try { 
        const docRef = doc(db, "proofOfPayments", proofOfPayment.id!);
        await updateDoc(docRef, {
            verifiedBy: verifier.id,
            verifiedByName: verifier.firstName + " " + verifier.lastName,
            verifiedAt: Timestamp.now(),
            rejectionReason: reason || "Payment proof rejected, please contact the organization for more details.",
            status: PaymentStatus.REJECTED,
            updatedAt: Timestamp.now(),
        });

        //To Add: email capability
    }catch(error){
        console.error("Error rejecting payment proof:", error);
        throw new Error("Failed to reject payment proof. Please try again.");
    }
}

export const updateProofOfPaymentStatus = async (
    proofOfPaymentId: string,
    status: "pending" | "verified" | "rejected",
    rejectionReason?: string,
    verifiedBy?: string,
    verifiedByName?: string) => {
    try {
        const proofRef = doc(db, "proofOfPayments", proofOfPaymentId);
        await updateDoc(proofRef, {
            status,
            rejectionReason: rejectionReason || null,
            verifiedByName: verifiedByName || null,
            verifiedBy: verifiedBy || null,
            verifiedAt: verifiedBy?Timestamp.now():null,
            updatedAt: Timestamp.now(),
        })
    } catch (error) {
        console.error("Error updating proof of payment status:", error);
        throw new Error("Failed to update proof of payment status. Please try again.");
    }
}
