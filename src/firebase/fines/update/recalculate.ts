import { FineStatus } from "@/constants/status";
import { db } from "@/firebase/firebase.config";
import { doc, getDocs, query, collection, where, updateDoc, Timestamp, getDoc } from "firebase/firestore";


  // Centralized error handler
const handleFirestoreError = (error: any, context: string) => {
    console.error(`Error ${context}:`, error);
    // Re-throwing allows the calling UI to handle the failed state.
    throw new Error(`Failed to ${context}.`);
  };

export const recalculateFines = async (fineId: string, addedAmount?: number | null, payment?: number | null, waived?: boolean | null, waivedAmount?: number | null) => {
    try {
        const fineRef = doc(db, "fines", fineId);
        const fineDoc = await getDoc(fineRef);
        if (!fineDoc.exists()) {
            console.error(`Fine with ID ${fineId} not found.`);
            return false;
        }

        const fineData = fineDoc.data();
        let newStatus =  fineData.status;
        let newBalance = fineData.balance;

        let newAccumulatedAmount = fineData.accumulatedAmount;
        if (addedAmount != null) {
            newAccumulatedAmount += addedAmount;
            newStatus = FineStatus.UNPAID;
            newBalance += addedAmount;
            if((newBalance-addedAmount) > 0 && (newBalance-addedAmount) < newAccumulatedAmount-addedAmount){
                newStatus = FineStatus.PARTIAL;
            }
        }
        let newPaidAmount = fineData.paidAmount;
        if (payment != null) {
            newPaidAmount += payment;
            newBalance = newAccumulatedAmount - newPaidAmount;
            if(newBalance <= 0){
                newStatus = FineStatus.PAID;
            }
        }
        if (waived && waivedAmount) {
            newAccumulatedAmount -= waivedAmount;
            newBalance -= waivedAmount;
            if(newBalance <= 0){
                newStatus = FineStatus.WAIVED;
            }
            else{
                newStatus = FineStatus.PARTIAL;
            }
        }
        await updateDoc(fineRef, {
            accumulatedAmount: newAccumulatedAmount,
            paidAmount: newPaidAmount,
            balance: newBalance,
            status: newStatus,
            "metadata.updatedAt": Timestamp.now(),
        });
        return true;

    }catch(error){
        handleFirestoreError(error, `recalculating fine with ID ${fineId}`);
        return false;
    }
  }