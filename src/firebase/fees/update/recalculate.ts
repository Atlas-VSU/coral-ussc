import { db } from "@/firebase/firebase.config";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { Fee } from "@/features/organization/fees/types";

// Centralized error handler
const handleFirestoreError = (error: any, context: string) => {
    console.error(`Error ${context}:`, error);
    throw new Error(`Failed to ${context}.`);
};

export const recalculateFees = async (feeId: string, payment?: number | null) => {
    try {
        const feeRef = doc(db, "fees", feeId);
        const feeDoc = await getDoc(feeRef);
        if (!feeDoc.exists()) {
            console.error(`Fee with ID ${feeId} not found.`);
            return { success: false };
        }

        const feeData = feeDoc.data() as Fee;
        let newPaidAmount = feeData.paidAmount || 0;
        
        if (payment != null) {
            newPaidAmount += payment;
        }

        const newBalance = Math.max(0, feeData.amount - newPaidAmount);
        let newStatus = "unpaid";
        
        if (newBalance <= 0) {
            newStatus = "paid";
        } else if (newPaidAmount > 0) {
            newStatus = "partial";
        }

        await updateDoc(feeRef, {
            paidAmount: newPaidAmount,
            balance: newBalance,
            status: newStatus,
            updatedAt: Timestamp.now(),
        });

        return { 
            success: true, 
            balance: newBalance, 
            status: newStatus,
            userId: feeData.userId
        };

    } catch (error) {
        handleFirestoreError(error, `recalculating fee with ID ${feeId}`);
        return { success: false };
    }
};
