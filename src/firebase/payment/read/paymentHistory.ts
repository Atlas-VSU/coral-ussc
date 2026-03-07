import { PaymentStatus } from "@/constants/status";
import { PaymentType } from "@/constants/types";
import { FinesPaymentLog } from "@/features/organization/fines/types";
import { db } from "@/firebase/firebase.config";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";


export const getPaymentHistoryById = async (paymentHistoryId: string, paymentType: PaymentType, paymentReferenceId: string) => { 
    try {
        const docRef = doc(db, paymentType, paymentReferenceId, "paymentHistory", paymentHistoryId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as FinesPaymentLog;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching payment history:", error);
        throw new Error("Failed to fetch payment history. Please try again.");
    }
}

export const getPaymentHistoriesByReferenceId = async (paymentReferenceId: string, paymentType: PaymentType) => {
    try {
        const subColRef = collection(db, paymentType, paymentReferenceId, "paymentHistory");
        const querySnapshot = await getDocs(subColRef);
        const paymentHistories = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return paymentHistories as FinesPaymentLog[];
    } catch (error) {
        console.error("Error fetching payment histories:", error);
        throw new Error("Failed to fetch payment histories. Please try again.");
    }
}

export const getVerifiedPaymentHistoriesByReferenceId = async (paymentReferenceId: string, paymentType: PaymentType) => {
    try {
        const subColRef = collection(db, paymentType, paymentReferenceId, "paymentHistory");
        const querySnapshot = await getDocs(subColRef);
        const paymentHistories = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return (paymentHistories as FinesPaymentLog[]).filter(ph => ph.status === PaymentStatus.VERIFIED);
    } catch (error) {
        console.error("Error fetching approved payment histories:", error);
        throw new Error("Failed to fetch approved payment histories. Please try again.");
    }
}
