import { db } from "@/firebase/firebase.config";
import { updateDoc, doc, Timestamp } from "firebase/firestore";


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