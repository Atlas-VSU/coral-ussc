import { StudentFines } from "@/features/organization/fines/types";
import { db } from "@/firebase/firebase.config";
import { doc, Timestamp, updateDoc } from "firebase/firestore";


export const updateFineItemCount = async (fines: StudentFines, toAdd?: number, toDeduct?: number) => {
    try{
        if (!fines){
            throw new Error("Fine data is required to update fine item count.");
        }
        else{
            let newItemCount = fines.fineItemsCount || 0;
            if (toAdd) {
                newItemCount += toAdd;
                toAdd = 0;
            }
            if (toDeduct) {
                newItemCount -= toDeduct;
                toDeduct = 0;
                if(newItemCount < 0){
                    toDeduct = 0;
                }
            }
            await updateDoc(doc(db, "fines", fines.id!), {
                fineItemsCount: newItemCount,
                "metadata.updatedAt": Timestamp.now(),
            });
            return newItemCount;
        }
    }catch(error){
        console.error(`Error updating fine item count for fine ID ${fines.id}:`, error);
        throw new Error(`Failed to update fine item count for fine ID ${fines.id}.`);
    }
}