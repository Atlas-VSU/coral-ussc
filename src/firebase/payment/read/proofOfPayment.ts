import { ProofOfPayment } from "@/features/organization/fines/types";
import { db } from "@/firebase/firebase.config";
import { doc, getDoc } from "firebase/firestore";


export const getProofOfPaymentById = async (proofOfPaymentId: string) => {
    try {
        const docRef = doc(db, "proofOfPayments", proofOfPaymentId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as ProofOfPayment;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching proof of payment:", error);
        throw new Error("Failed to fetch proof of payment. Please try again.");
    }
}