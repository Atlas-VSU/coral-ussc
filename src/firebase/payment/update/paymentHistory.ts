import { ProofOfPayment } from "@/features/organization/fines/types";
import { markFineItemsAsPaid } from "@/firebase/fines/update/fineItemsStatus";
import { db } from "@/firebase/firebase.config";
import { doc, getDoc, Timestamp, updateDoc } from "firebase/firestore";
import { recalculateFines } from "@/firebase/fines/update/recalculate";


export const verifyPaymentHistory = async (paymentHistoryId: string, proofOfPayment: ProofOfPayment) => {
    const docRef = doc(db, proofOfPayment.paymentType, proofOfPayment.referenceId, "paymentHistory", paymentHistoryId);
        try { 
            await updateDoc(docRef, {
                verifiedBy: proofOfPayment.verifiedBy,
                verifiedByName: proofOfPayment.verifiedByName,
                verifiedAt: proofOfPayment.verifiedAt,
                notes: proofOfPayment.notes,
                status: proofOfPayment.status,
                "metaData.updatedAt": Timestamp.now(),
            });
            if(proofOfPayment.paymentType === "fines"){
                await markFineItemsAsPaid(proofOfPayment.referenceId);
                await recalculateFines(proofOfPayment.referenceId, null, proofOfPayment.amount);

                const fineRef = doc(db, "fines", proofOfPayment.referenceId);
                const fineSnap = await getDoc(fineRef);
                if (fineSnap.exists()) {
                    const fineData = fineSnap.data();
                    const clearanceRef = doc(db, 'clearanceStatus', fineData.userId);
                    await updateDoc(clearanceRef, {
                        [`blockingItems.${proofOfPayment.referenceId}.balance`]: fineData.balance,
                        [`blockingItems.${proofOfPayment.referenceId}.status`]: fineData.status === "paid" ? "paid" : "unpaid",
                        [`blockingItems.${proofOfPayment.referenceId}.pendingReview`]: false,
                    });
                }
            }
            
        }catch(error){
            console.error("Error verifying payment history:", error);
            throw new Error("Failed to verify payment history. Please try again.");
        }
}

export const rejectPaymentHistory = async (paymentHistoryId: string, proofOfPayment: ProofOfPayment) => {
    const docRef = doc(db, proofOfPayment.paymentType, proofOfPayment.referenceId, "paymentHistory", paymentHistoryId);
        try { 
            await updateDoc(docRef, {
                verifiedBy: proofOfPayment.verifiedBy,
                verifiedByName: proofOfPayment.verifiedByName,
                verifiedAt: proofOfPayment.verifiedAt,
                rejectionReason: proofOfPayment.rejectionReason,
                status: proofOfPayment.status,
                "metaData.updatedAt": Timestamp.now(),
            });

            if(proofOfPayment.paymentType === "fines"){
                const fineRef = doc(db, "fines", proofOfPayment.referenceId);
                const fineSnap = await getDoc(fineRef);
                if (fineSnap.exists()) {
                    const fineData = fineSnap.data();
                    const clearanceRef = doc(db, 'clearanceStatus', fineData.userId);
                    await updateDoc(clearanceRef, {
                        [`blockingItems.${proofOfPayment.referenceId}.pendingReview`]: false,
                    });
                }
            }
        }catch(error){
            console.error("Error rejecting payment history:", error);
            throw new Error("Failed to reject payment history. Please try again.");
        }
}