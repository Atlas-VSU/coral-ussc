import { db } from "@/firebase/firebase.config";
import { collection, doc, getDocs, query, updateDoc, where, writeBatch } from "firebase/firestore";
import { cacheService, CACHE_KEYS } from "@/services/cacheService";
import { getAllFines, getAllUnpaidFinesforOrg } from "../read/fines";
import { getCurrentUserData } from "@/firebase/users";
import { Member } from "@/features/organization/members/types";


export const markFineItemsAsPaid = async (fineId: string, fineItemId?: string) => {
    try {
        if (fineItemId) {
            const fineItemsRef = doc(db, "fines", fineId, "fineItems", fineItemId);
            await updateDoc(fineItemsRef, {
                isPaid: true,
                isPending: false,
            });
            const currUser = await getCurrentUserData() as unknown as Member;
            const orgId = currUser.id || '';
            cacheService.invalidate(CACHE_KEYS.fineDoc(fineId));
            cacheService.invalidate(CACHE_KEYS.fineItems(fineId));
            cacheService.invalidate(CACHE_KEYS.finesAll(orgId));
            cacheService.invalidate(CACHE_KEYS.finesUnpaid(orgId));

            getAllFines().catch(console.error);
            getAllUnpaidFinesforOrg().catch(console.error);
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
                    isPending: false,
                });
            });

            await batch.commit();
            const currUser = await getCurrentUserData() as unknown as Member;
            const orgId = currUser.id || '';
            cacheService.invalidate(CACHE_KEYS.fineDoc(fineId));
            cacheService.invalidate(CACHE_KEYS.fineItems(fineId));
            cacheService.invalidate(CACHE_KEYS.finesAll(orgId));
            cacheService.invalidate(CACHE_KEYS.finesUnpaid(orgId));

            getAllFines().catch(console.error);
            getAllUnpaidFinesforOrg().catch(console.error);
            console.log(`Marked ${querySnapshot.size} items as paid for fine: ${fineId}`);
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
            const currUser = await getCurrentUserData() as unknown as Member;
            const orgId = currUser.id || '';
            cacheService.invalidate(CACHE_KEYS.fineDoc(fineId));
            cacheService.invalidate(CACHE_KEYS.fineItems(fineId));
            cacheService.invalidate(CACHE_KEYS.finesAll(orgId));
            cacheService.invalidate(CACHE_KEYS.finesUnpaid(orgId));

            getAllFines().catch(console.error);
            getAllUnpaidFinesforOrg().catch(console.error);
            console.log(`Marked ${fineItemIds.length} items as paid for fine: ${fineId}`);
            
    } catch (error) {
        console.error("Error marking fine items as paid:", error);
        throw error;
    }
}