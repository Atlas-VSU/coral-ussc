
import { db } from "@/firebase/firebase.config";
import { doc, getDoc, Timestamp, updateDoc } from "firebase/firestore";
import { recalculateFines } from "@/firebase/fines/update/recalculate";
import { recalculateFees } from "@/firebase/fees/update/recalculate";
import { Member } from "@/features/organization/members/types";
import { PaymentStatus } from "@/constants/status";
import { cacheService } from "@/services/cacheService";
import { getAllProofOfPayments } from "../read/proofOfPayment";
import { fetchFeesForOrg, fetchUnpaidFeesForOrg } from "@/firebase/fees";
import { getAllFines, getAllUnpaidFinesforOrg } from "@/firebase/fines/read/fines";


export const verifyPaymentHistory = async (
    paymentHistoryId: string,
    verifier: Member,
    type: string,
    refId: string,
    amount: number,
    note?: string
) => {
    const docRef = doc(db, type, refId, "paymentHistory", paymentHistoryId);
        try { 
            await updateDoc(docRef, {
                verifiedBy: verifier.id,
                verifiedByName: `${verifier.firstName} ${verifier.lastName}`,
                verifiedAt: Timestamp.now(),
                notes: note? note: "Payment Verified",
                status: PaymentStatus.VERIFIED,
                "metadata.updatedAt": Timestamp.now(),
            });
            if(type === "fines"){
                await recalculateFines(refId, null, amount);

                const fineRef = doc(db, "fines", refId);
                const fineSnap = await getDoc(fineRef);
                if (fineSnap.exists()) {
                    const fineData = fineSnap.data();
                    const clearanceRef = doc(db, 'clearanceStatus', fineData.userId);
                    await updateDoc(clearanceRef, {
                        [`blockingItems.${refId}.balance`]: fineData.balance,
                        [`blockingItems.${refId}.status`]: fineData.status === "paid" ? "paid" : "unpaid",
                        [`blockingItems.${refId}.pendingReview`]: false,
                    });
                }
            }

            if(type === "fees"){
                const result = await recalculateFees(refId, amount);
                if (result.success && result.userId) {
                    const clearanceRef = doc(db, 'clearanceStatus', result.userId);
                    await updateDoc(clearanceRef, {
                        [`blockingItems.${refId}.balance`]: result.balance,
                        [`blockingItems.${refId}.status`]: result.status === "paid" ? "paid" : "unpaid",
                        [`blockingItems.${refId}.pendingReview`]: false,
                    });
                }
            }

        }catch(error){
            console.error("Error verifying payment history:", error);
            throw new Error("Failed to verify payment history. Please try again.");
        }
        cacheService.invalidateByPrefix('payments:');
        cacheService.invalidateByPrefix('fees:');
        cacheService.invalidateByPrefix('fines:');
        cacheService.invalidateByPrefix('clearance:');
        // Pre-emptive warming
        getAllProofOfPayments(verifier.id!).catch(console.error);
        fetchFeesForOrg(verifier.id!).catch(console.error);
        fetchUnpaidFeesForOrg().catch(console.error);
        getAllFines().catch(console.error);
        getAllUnpaidFinesforOrg().catch(console.error);
}

export const rejectPaymentHistory = async (
    paymentHistoryId: string,
    verifier: Member,
    type: string,
    refId: string,
    reason?: string,
) => {
    const docRef = doc(db, type, refId, "paymentHistory", paymentHistoryId);
        try { 
            await updateDoc(docRef, {
                verifiedBy: verifier.id,
                verifiedByName: `${verifier.firstName} ${verifier.lastName}`,
                verifiedAt: Timestamp.now(),
                rejectionReason: reason? reason: "Payment Rejected, please contact the organization for more details.",
                status: PaymentStatus.REJECTED,
                "metadata.updatedAt": Timestamp.now(),
            });

            if(type === "fines"){
                const fineRef = doc(db, "fines", refId);
                const fineSnap = await getDoc(fineRef);
                if (fineSnap.exists()) {
                    const fineData = fineSnap.data();
                    if (fineData.balance > 0 && fineData.paidAmount > 0) {
                        await updateDoc(fineRef, {status: "partial"});
                    } else {
                        await updateDoc(fineRef, {status: "unpaid"});
                     }
                    const clearanceRef = doc(db, 'clearanceStatus', fineData.userId);
                    await updateDoc(clearanceRef, {
                        [`blockingItems.${refId}.pendingReview`]: false,
                    });
                }
            }

            if(type === "fees"){
                const feeRef = doc(db, "fees", refId);
                const feeSnap = await getDoc(feeRef);
                if (feeSnap.exists()) {
                    const feeData = feeSnap.data();
                    const clearanceRef = doc(db, 'clearanceStatus', feeData.userId);
                    await updateDoc(clearanceRef, {
                        [`blockingItems.${refId}.pendingReview`]: false,
                    });
                }
            }
        }catch(error){
            console.error("Error rejecting payment history:", error);
            throw new Error("Failed to reject payment history. Please try again.");
        }
        cacheService.invalidateByPrefix('payments:');
        cacheService.invalidateByPrefix('fees:');
        cacheService.invalidateByPrefix('fines:');
        cacheService.invalidateByPrefix('clearance:');
        // Pre-emptive warming
        getAllProofOfPayments(verifier.id!).catch(console.error);
        fetchFeesForOrg(verifier.id!).catch(console.error);
        fetchUnpaidFeesForOrg().catch(console.error);
        getAllFines().catch(console.error);
        getAllUnpaidFinesforOrg().catch(console.error);
}
