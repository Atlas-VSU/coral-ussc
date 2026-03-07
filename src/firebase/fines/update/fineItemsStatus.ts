import { db } from "@/firebase/firebase.config";
import { collection, doc, getDocs, query, where, writeBatch } from "firebase/firestore"


export const markFineItemsAsPaid = async (fineId: string) => {
    try {
        const fineItemsRef = collection(db, "fines", fineId, "fineItems");
        const q = query(fineItemsRef, where("isPaid", "==", false));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            console.log("No pending events found.");
            return;
        }

        const batch = writeBatch(db);
        querySnapshot.forEach((doc) => {
            const fineItemRef = doc.ref;
            batch.update(fineItemRef, { isPaid: true });
        })
        await batch.commit();

    } catch (error) {
        console.error("Error marking fine items as paid:", error);
        throw new Error("Failed to mark fine items as paid. Please try again.");
    }
}