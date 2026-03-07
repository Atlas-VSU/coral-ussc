import { ProofOfPayment } from "@/features/organization/fines/types";
import { markFineItemsAsPaid } from "@/firebase/fines/update/fineItemsStatus";
import { db } from "@/firebase/firebase.config";
import { doc, Timestamp, updateDoc } from "firebase/firestore";


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
        }catch(error){
            console.error("Error rejecting payment history:", error);
            throw new Error("Failed to reject payment history. Please try again.");
        }
}