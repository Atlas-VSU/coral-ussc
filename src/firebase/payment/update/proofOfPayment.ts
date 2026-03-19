
import { ProofOfPayment } from "@/features/organization/fines/types";
import { db } from "@/firebase/firebase.config";
import { getCurrentUserData } from "@/firebase/users";
import { Member } from "@/features/organization/members/types"; // Import Member type
import { collection, doc, Timestamp, updateDoc } from "firebase/firestore";
import { rejectPaymentHistory, verifyPaymentHistory } from "./paymentHistory";
import { PaymentStatus } from "@/constants/status";
import { generateReceiptId } from "@/features/organization/payments/utils";
import { cacheService, CACHE_KEYS } from "@/services/cacheService";
import { getAllProofOfPayments } from "../read/proofOfPayment";


export const updateProofOfPaymentHistoryId = async (proofOfPaymentId: string, paymentHistoryId: string) => {
    try{
        const docRef = doc(db, "proofOfPayments", proofOfPaymentId);
        await updateDoc(docRef, {
            paymentHistoryId: paymentHistoryId,
            "updatedAt": Timestamp.now(),
        });
        const user = await getCurrentUserData();
        const orgId = user?.uid || '';
        cacheService.invalidate(CACHE_KEYS.proofOfPayments(orgId));
        cacheService.invalidate(CACHE_KEYS.clearanceAll(orgId));
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

        const orgId = verifier.id || '';
        cacheService.invalidate(CACHE_KEYS.proofOfPayments(orgId));
        cacheService.invalidate(CACHE_KEYS.finesAll(orgId));
        cacheService.invalidate(CACHE_KEYS.finesUnpaid(orgId));
        cacheService.invalidate(CACHE_KEYS.feesForOrg(orgId));
        cacheService.invalidate(CACHE_KEYS.feesUnpaid(orgId));
        cacheService.invalidate(CACHE_KEYS.clearanceAll(orgId));
        
        getAllProofOfPayments(orgId).catch(console.error);

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

        const orgId = verifier.id || '';
        cacheService.invalidate(CACHE_KEYS.proofOfPayments(orgId));
        cacheService.invalidate(CACHE_KEYS.finesAll(orgId));
        cacheService.invalidate(CACHE_KEYS.finesUnpaid(orgId));
        cacheService.invalidate(CACHE_KEYS.feesForOrg(orgId));
        cacheService.invalidate(CACHE_KEYS.feesUnpaid(orgId));
        cacheService.invalidate(CACHE_KEYS.clearanceAll(orgId));
        
        getAllProofOfPayments(orgId).catch(console.error);

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
        
        const user = await getCurrentUserData();
        const orgId = user?.uid || '';
        cacheService.invalidate(CACHE_KEYS.proofOfPayments(orgId));
        cacheService.invalidate(CACHE_KEYS.finesAll(orgId));
        cacheService.invalidate(CACHE_KEYS.finesUnpaid(orgId));
        cacheService.invalidate(CACHE_KEYS.feesForOrg(orgId));
        cacheService.invalidate(CACHE_KEYS.feesUnpaid(orgId));
        cacheService.invalidate(CACHE_KEYS.clearanceAll(orgId));

        if (orgId) {
            getAllProofOfPayments(orgId).catch(console.error);
        }
    } catch (error) {
        console.error("Error updating proof of payment status:", error);
        throw new Error("Failed to update proof of payment status. Please try again.");
    }
}
