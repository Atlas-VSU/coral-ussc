import { db } from "@/firebase/firebase.config";
import { collection, doc, getDocs, query, updateDoc, where, writeBatch } from "firebase/firestore"


export const markFineItemsAsPaid = async (fineId: string, fineItemId?:string) => {
    try {
        if (fineItemId) {
            const fineItemsRef = doc(db, "fines", fineId, "fineItems", fineItemId);
            await updateDoc(fineItemsRef, {
                isPaid: true,
            })
            console.log(`Marked fine item ${fineItemId} as paid for fine: ${fineId}`);
        }
        else {
            const fineItemsRef = collection(db, "fines", fineId, "fineItems");
            const q = query(fineItemsRef, where("isPaid", "==", false));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                console.log("No pending fine items found.");
                return;
            }

            const batch = writeBatch(db);

            // Update all sub-items
            querySnapshot.forEach((itemDoc) => {
                batch.update(itemDoc.ref, {
                    isPaid: true,
                });
            });

            await batch.commit();
            console.log(`Marked ${querySnapshot.size} items as paid for fine: ${fineId}`);
        }

    } catch (error) {
        console.error("Error marking fine items as paid:", error);
        throw error; 
    }
}