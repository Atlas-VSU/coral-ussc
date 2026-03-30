
import { db } from "@/firebase/firebase.config";
import { doc, getDoc, Timestamp, updateDoc } from "firebase/firestore";
import { recalculateFines } from "@/firebase/fines/update/recalculate";
import { recalculateFees } from "@/firebase/fees/update/recalculate";
import { Member } from "@/features/organization/members/types";
import { PaymentStatus } from "@/constants/status";
import { cacheService, CACHE_KEYS } from "@/services/cacheService";
import { fetchFeesForOrg } from "@/firebase/fees";
import { recalculateClearanceStatus } from "@/firebase/clearance";


export const verifyPaymentHistory = async (
    paymentHistoryId: string,
    verifier: Member,
    type: string,
    refId: string,
    amount: number,
    note?: string | null,
    itemIds?: string[],
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
                    for (const itemId of itemIds ?? []) {
                        await updateDoc(clearanceRef, {
                            [`blockingItems.${itemId}.balance`]: fineData.balance,
                            [`blockingItems.${itemId}.status`]: fineData.status === "paid" ? "paid" : "unpaid",
                            [`blockingItems.${itemId}.pendingReview`]: false,
                        });
                     }
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
        
        const orgId = verifier.id || '';
        cacheService.invalidate(CACHE_KEYS.proofOfPayments(orgId));
        cacheService.invalidate(CACHE_KEYS.feesForOrg(orgId));
        cacheService.invalidate(CACHE_KEYS.feesUnpaid(orgId));
        cacheService.invalidate(CACHE_KEYS.finesAll(orgId));
        cacheService.invalidate(CACHE_KEYS.finesUnpaid(orgId));
        cacheService.invalidate(CACHE_KEYS.clearanceAll(orgId));
        
        fetchFeesForOrg(orgId).catch(console.error);
}

export const rejectPaymentHistory = async (
    paymentHistoryId: string,
    verifier: Member,
    type: string,
    refId: string,
    itemRefId?: string[],
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
                    for (const itemId of itemRefId ?? []) {
                        await updateDoc(clearanceRef, {
                        [`blockingItems.${itemId}.pendingReview`]: false,
                    });
                    }
                }
            }

            if(type === "fees"){
                const feeRef = doc(db, "fees", refId);
                const feeSnap = await getDoc(feeRef);
                if (feeSnap.exists()) {
                    await updateDoc(feeRef, {status: "unpaid"});
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
        
        const orgId = verifier.id || '';
        cacheService.invalidate(CACHE_KEYS.proofOfPayments(orgId));
        cacheService.invalidate(CACHE_KEYS.feesForOrg(orgId));
        cacheService.invalidate(CACHE_KEYS.finesAll(orgId));
        cacheService.invalidate(CACHE_KEYS.clearanceAll(orgId));
        
        // Pre-emptive warming
        fetchFeesForOrg(orgId).catch(console.error);
}
