import { FineItem } from "@/features/organization/fines/types";
import { fetchClearanceStatus, recalculateClearanceStatus } from "@/firebase/clearance";
import { db } from "@/firebase/firebase.config";
import { updateFineStats } from "@/firebase/stats/update/updateStats";
import { updateDoc, doc, Timestamp, getDocs, collection, query, where, limit, deleteDoc, deleteField } from "firebase/firestore";


export const updateLastFineIssuedAt = async (fineId: string) => { 
    try {
        await updateDoc(doc(db, "fines", fineId), {
            "lastFineIssuedAt": Timestamp.now(),
            "metadata.updatedAt": Timestamp.now(),
        });
    } catch (error) {
        console.error(`Error updating last fine issued at for fine ID ${fineId}:`, error);
        throw new Error(`Failed to update last fine issued at for fine ID ${fineId}.`);
    }
}

export const updateFirstFineIssuedAt = async (fineId: string) => {
    try {
        await updateDoc(doc(db, "fines", fineId), {
            "firstFineIssuedAt": Timestamp.now(),
            "lastFineIssuedAt": Timestamp.now(),
            "metadata.updatedAt": Timestamp.now(),
        });
    } catch (error) {
        console.error(`Error updating first fine issued at for fine ID ${fineId}:`, error);
        throw new Error(`Failed to update first fine issued at for fine ID ${fineId}.`);
    }
}


//Backup Code for removing fines on special attendance, in case fines are already generated and someone wants to be excluded by the fines (like waived)
//this can be used in members page additional choices for edit button or something
export const removeFinesOnSpecialAttendance = async (studentId: string, eventId: string, userId:string) => {
    try {
        const fines = await getDocs(query(collection(db, "fines"), where("studentId", "==", studentId), limit(1)));
        const fineItem = await getDocs(query(collection(db, "fines", fines.docs[0].id, "fineItems"), where("eventId", "==", eventId), limit(1)));
        if (fineItem.empty) return;
        
        //hard delete the fineItem from fineItems subcollection
        await deleteDoc(doc(db, "fines", fines.docs[0].id, "fineItems", fineItem.docs[0].id));
        const _fines = fines.docs[0].data();
        const _fineItem = fineItem.docs[0].data() as FineItem;
        const newBalance = _fines.balance - _fineItem.amount;
        const newAccumulatedAmount = _fines.accumulatedAmount - _fineItem.amount;

        await updateDoc(doc(db, "fines", fines.docs[0].id), {
            ..._fines,
            fineItemsCount: _fines.fineItemCount - 1,
            accumulatedAmount: newAccumulatedAmount,
            balance: newBalance,
            metadata: {
                ..._fines.metadata,
                updatedAt: Timestamp.now(),
            },
            status: newBalance <= 0 ? "paid" : newAccumulatedAmount === newBalance?"unpaid": "partial",
        });
        await updateDoc(doc(db, "clearanceStatus", userId), {
           [`blockingItems.${_fineItem.id}`]: deleteField(),
        })
        await recalculateClearanceStatus(userId);
        await updateFineStats("2ndSem-2025-2026", 0, _fineItem.amount);

    }catch (error) {
        console.error(`Error removing fines for student ID ${studentId} and event ID ${eventId}:`, error);
        throw new Error(`Failed to remove fines for student ID ${studentId} and event ID ${eventId}.`);
    }
 }