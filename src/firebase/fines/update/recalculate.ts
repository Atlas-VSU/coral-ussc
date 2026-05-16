import { FineStatus } from "@/constants/status";
import { db } from "@/firebase/firebase.config";
import { doc, updateDoc, Timestamp, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { cacheService, CACHE_KEYS } from "@/services/cacheService";
import { getCurrentUserData } from "@/firebase/users";
import { Member } from "@/features/organization/members/types";


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
            return { success: false };
        }

        const fineData = fineDoc.data();
        if (!fineData) return { success: false };

        let newStatus =  fineData.status;
        let newBalance = fineData.balance;
        let newWaivedAmount = fineData.waivedAmount || null;
        let newWaivedAt = fineData.waivedAt || null;
        let newWaivedBy = fineData.waivedBy || null;

        let newAccumulatedAmount = fineData.accumulatedAmount;
        if (addedAmount != null) {
            newAccumulatedAmount += addedAmount;
            newStatus = FineStatus.UNPAID;
            newBalance += addedAmount;
            if(newBalance > 0 && fineData.paidAmount > 0){
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
            else if (payment > 0 && fineData.accumulatedAmount > 0) {
                newStatus = FineStatus.PARTIAL;
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
            newWaivedAmount = (newWaivedAmount || 0) + waivedAmount;
            newWaivedAt = Timestamp.now();
            const currUser = await getCurrentUserData() as unknown as Member;
            newWaivedBy = currUser.firstName + " " + currUser.lastName;
        }

        const fineItemsRef = collection(db, "fines", fineId, "fineItems");
        const q = query(fineItemsRef, where("isPending", "==", true));
        const fineItemsSnapShot = await getDocs(q);
        
        if (!fineItemsSnapShot.empty) {
            newStatus = FineStatus.PENDING;
         }

        await updateDoc(fineRef, {
            accumulatedAmount: newAccumulatedAmount,
            paidAmount: newPaidAmount,
            balance: newBalance,
            status: newStatus,
            waivedAmount: newWaivedAmount,
            waivedAt: newWaivedAt,
            waivedBy: newWaivedBy,
            "metadata.updatedAt": Timestamp.now(),
        });


        return { 
            success: true, 
            balance: newBalance, 
            status: newStatus 
        };

    }catch(error){
        handleFirestoreError(error, `recalculating fine with ID ${fineId}`);
        return { success: false };
    }
  }