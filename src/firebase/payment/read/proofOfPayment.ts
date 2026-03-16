import { ProofOfPayment } from "@/features/organization/fines/types";
import { db } from "@/firebase/firebase.config";
import { collection, doc, getDoc, getDocs, orderBy, query, where } from "firebase/firestore";
import { cacheService, CACHE_KEYS, CACHE_DURATIONS } from "@/services/cacheService";


export const getProofOfPaymentById = async (proofOfPaymentId: string) => {
    return cacheService.getOrFetch(
        CACHE_KEYS.proofOfPayment(proofOfPaymentId),
        async () => {
            const docRef = doc(db, "proofOfPayments", proofOfPaymentId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && !docSnap.data().isArchived) {
                return { id: docSnap.id, ...docSnap.data() } as ProofOfPayment;
            }
            return null;
        },
        CACHE_DURATIONS.PAYMENT_HISTORY
    );
}

export const getAllProofOfPayments = async (orgId: string) => {
    return cacheService.getOrFetch(
        CACHE_KEYS.proofOfPayments(orgId),
        async () => {
            const proofOfPaymentsRef = collection(db, "proofOfPayments");
            const q = query(proofOfPaymentsRef, where("orgId", "==", orgId), where("isArchived", "==", false));
            const querySnapshot = await getDocs(q);
            const proofOfPayments: ProofOfPayment[] = [];
            querySnapshot.forEach((doc) => {
                proofOfPayments.push({ id: doc.id, ...doc.data() } as ProofOfPayment);
            });
            return proofOfPayments;
        },
        CACHE_DURATIONS.PAYMENTS
    );
}

export const getProofOfPaymentByUserId = async (userId: string, orgId?:string) => {
    try {
        const constraints = [where("userId", "==", userId), where("isArchived", "==", false)];
        if (orgId) {
            constraints.push(where("orgId", "==", orgId));
        }
        const docSnap = await getDocs(query(collection(db, "proofOfPayments"),
            ...constraints));
        
        if (docSnap.empty) {
            return null;
        }
        const doc = docSnap.docs[0];
        return { id: doc.id, ...doc.data() } as ProofOfPayment;
    } catch (error) {
        console.error("Error fetching proof of payment:", error);
        throw new Error("Failed to fetch proof of payment. Please try again.");
    }
}