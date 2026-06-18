import { db } from "@/firebase/firebase.config";
import { collection, doc, getDoc, getDocs, query, updateDoc, where, writeBatch, Timestamp } from "firebase/firestore";
import { cacheService, CACHE_KEYS } from "@/services/cacheService";
import { getCurrentUserData } from "@/firebase/users";
import { Member } from "@/features/organization/members/types";
import { FineItem } from "@/features/organization/fines/types";
import { recalculateFines } from "./recalculate";
import { buildClearanceId } from "@/firebase/clearance";
import { getActiveTerm } from "@/firebase/term";


export const markFineItemsAsPaid = async (fineId: string, fineItemId?: string) => {
    try {
        if (fineItemId) {
            const fineItemsRef = doc(db, "fines", fineId, "fineItems", fineItemId);
            await updateDoc(fineItemsRef, {
                isPaid: true,
                isPending: false,
            });
            // const currUser = await getCurrentUserData() as unknown as Member;
            // const orgId = currUser.orgId || '';
            // cacheService.invalidate(CACHE_KEYS.fineDoc(fineId));
            // cacheService.invalidate(CACHE_KEYS.fineItems(fineId));
        }
        else {
            const fineItemsRef = collection(db, "fines", fineId, "fineItems");
            const q = query(fineItemsRef, where("isPaid", "==", false));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                return;
            }

            const batch = writeBatch(db);

            // Update all sub-items
            querySnapshot.forEach((itemDoc) => {
                batch.update(itemDoc.ref, {
                    isPaid: true,
                    isPending: false,
                });
            });

            await batch.commit();
            // const currUser = await getCurrentUserData() as unknown as Member;
            // const orgId = currUser.orgId || '';
            // cacheService.invalidate(CACHE_KEYS.fineDoc(fineId));
            // cacheService.invalidate(CACHE_KEYS.fineItems(fineId));
        }

    } catch (error) {
        console.error("Error marking fine items as paid:", error);
        throw error;
    }
}


export const markFineItemsAsNotPending = async (fineId: string, fineItemIds: string[]) => {
    try {
            const batch = writeBatch(db);
        for (const item of fineItemIds) {
            batch.update(doc(db, "fines", fineId, "fineItems", item), {
                isPaid: false,
                isPending: false,
            });
        }

            await batch.commit();
            // const currUser = await getCurrentUserData() as unknown as Member;
            // const orgId = currUser.orgId || '';
            // cacheService.invalidate(CACHE_KEYS.fineDoc(fineId));
            // cacheService.invalidate(CACHE_KEYS.fineItems(fineId));
    } catch (error) {
        console.error("Error marking fine items as paid:", error);
        throw error;
    }
}

export const markFineItemAsWaived = async (fineId: string, fineItem: FineItem, waiveReason?: string, term?: any) => {
     try {
        const fineItemsRef = doc(db, "fines", fineId, "fineItems", fineItem.id);
        const waivedReason = waiveReason ? waiveReason : ""; 
        const currUser = await getCurrentUserData() as unknown as Member;
        await updateDoc(fineItemsRef, {
            isPaid: true,
            isWaived: true,
            isPending: false,
            waivedAt: Timestamp.now(),
            waivedReason: waivedReason,
            waivedBy: currUser.firstName + " " + currUser.lastName,
        });
         //Needs recalculation on parent fine, because what if only one fine item was waived when theres many
         //overall fines should reflect on the parent of fineitems
        await recalculateFines(fineId, null, null, true, fineItem.amount);
         
        const fineRef = doc(db, "fines", fineId);
        const fineSnap = await getDoc(fineRef);
        if (fineSnap.exists()) {
            const fineData = fineSnap.data();
            const activeTerm = term || await getActiveTerm();
            const id = buildClearanceId(fineData.userId, currUser.orgId, currUser.accessLevel as number, activeTerm!);
            const clearanceRef = doc(db, 'clearanceStatus', id);
            //Clearance blocking items are updated also and both waived and paid items are treated the same here since they both should not hinder clearance
            //this can be changed, if we separate treatment of waived and paid on clearance, we need also to refactor all other dependencies on these status labels (such as basis for clearance as cleared or not)
            await updateDoc(clearanceRef, {
                [`blockingItems.${fineItem.id}.balance`]: 0,
                [`blockingItems.${fineItem.id}.status`]: fineData.status === "waived" || fineData.status === "paid" ? "paid" : "unpaid",
                [`blockingItems.${fineItem.id}.pendingReview`]: false,
            });
        }


    } catch (error) {
        console.error("Error waiving fine item:", error);
        throw new Error("Failed to waive fine item. Please try again.");
    }
}
