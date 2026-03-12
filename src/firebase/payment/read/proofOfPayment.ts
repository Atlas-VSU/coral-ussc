import { ProofOfPayment } from "@/features/organization/fines/types";
import { db } from "@/firebase/firebase.config";
import { collection, doc, getDoc, getDocs, orderBy, query, where } from "firebase/firestore";


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

export const getAllProofOfPayments = async (orgId:string) => { 
    try {
        const proofOfPaymentsRef = collection(db, "proofOfPayments");
        const q = query(proofOfPaymentsRef, where("orgId", "==", orgId));
        const querySnapshot = await getDocs(q);
        const proofOfPayments: ProofOfPayment[] = [];
        querySnapshot.forEach((doc) => {
            proofOfPayments.push({ id: doc.id, ...doc.data() } as ProofOfPayment);
        });
        return proofOfPayments;
    } catch (error) {
        console.error("Error fetching pending proof of payments:", error);
        throw new Error("Failed to fetch pending proof of payments. Please try again.");
    }
}