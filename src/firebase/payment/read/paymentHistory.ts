import { PaymentStatus } from "@/constants/status";
import { PaymentType } from "@/constants/types";
import { FinesPaymentLog } from "@/features/organization/fines/types";
import { db } from "@/firebase/firebase.config";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { cacheService, CACHE_KEYS, CACHE_DURATIONS } from "@/services/cacheService";


export const getPaymentHistoryById = async (paymentHistoryId: string, paymentType: PaymentType, paymentReferenceId: string) => { 
    return cacheService.getOrFetch(
        `payments:historyDoc:${paymentReferenceId}:${paymentHistoryId}`,
        async () => {
            const docRef = doc(db, paymentType, paymentReferenceId, "paymentHistory", paymentHistoryId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                console.log(`fetched paymentHistory doc with cost: 1`);
                return { id: docSnap.id, ...docSnap.data() } as FinesPaymentLog;
            } else {
                return null;
            }
        },
        CACHE_DURATIONS.PAYMENT_HISTORY
    );
}

export const getFinesPaymentHistoriesByReferenceId = async (paymentReferenceId: string) => {
    return cacheService.getOrFetch(
        CACHE_KEYS.paymentHistory(paymentReferenceId),
        async () => {
            const subColRef = collection(db, "fines", paymentReferenceId, "paymentHistory");
            const querySnapshot = await getDocs(subColRef);
            console.log(`fetched paymentHistory collection for referenceId ${paymentReferenceId} with cost: ${querySnapshot.size}`);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FinesPaymentLog[];
        },
        CACHE_DURATIONS.PAYMENT_HISTORY
    );
}

export const getFinesVerifiedPaymentHistoriesByReferenceId = async (paymentReferenceId: string, paymentType: PaymentType) => {
    return cacheService.getOrFetch(
        CACHE_KEYS.verifiedHistory(paymentType, paymentReferenceId),
        async () => {
            const subColRef = collection(db, paymentType, paymentReferenceId, "paymentHistory");
            const querySnapshot = await getDocs(subColRef);
            console.log(`fetched paymentHistory collection for referenceId ${paymentReferenceId} with cost: ${querySnapshot.size}`);
            const paymentHistories = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FinesPaymentLog[];
            return paymentHistories.filter(ph => ph.status === PaymentStatus.VERIFIED);
        },
        CACHE_DURATIONS.PAYMENT_HISTORY
    );
}

export const getPendingPaymentHistory = async (paymentTypeRefId: string, paymentType: string, paymentProofId: string) => {
    return cacheService.getOrFetch(
        `payments:pending:${paymentType}:${paymentTypeRefId}`,
        async () => {
            const subColRef = collection(db, paymentType, paymentTypeRefId, "paymentHistory");
            const querySnapshot = await getDocs(query(subColRef, where("paymentProofId", "==", paymentProofId)));
            console.log(`fetched pending paymentHistory for paymentProofId ${paymentProofId} with cost: ${querySnapshot.size}`);
            if (querySnapshot.empty) return null;
            const firstDoc = querySnapshot.docs[0];
            return {
                id: firstDoc.id,
                ...firstDoc.data()
            } as FinesPaymentLog;
        },
        CACHE_DURATIONS.PAYMENT_HISTORY
    );
}
