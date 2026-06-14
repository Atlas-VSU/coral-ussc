import { db } from "@/firebase/firebase.config";
import { updateDoc, doc, Timestamp, getDocs, writeBatch, collection } from "firebase/firestore";


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

export const updateAllFineMetadata = async () => {
    try {
        const fines = await getDocs(collection(db, "fines"));
        const docs = fines.docs;
        const BATCH_SIZE = 500;

        for (let i = 0; i < docs.length; i += BATCH_SIZE) {
            const chunk = docs.slice(i, i + BATCH_SIZE);
            const batch = writeBatch(db);
            chunk.forEach((fine) => {
                batch.update(fine.ref, {
                    "metadata.isArchived": false,
                });
            });
            await batch.commit();
        }
    } catch (error) {
        console.error(`Error updating all fine metadata:`, error);
        throw new Error(`Failed to update all fine metadata.`);
    }
}