import { db } from "@/firebase/firebase.config";
import { addDoc, collection, getCountFromServer, Timestamp } from "firebase/firestore";
import { getProofOfPaymentById } from "../read/proofOfPayment";
import { updateProofOfPaymentHistoryId } from "../update/proofOfPayment";
import { getCurrentUserData } from "@/firebase/users";
import { Member, MemberData } from "@/features/organization/members/types";
import { recalculateFines } from "@/firebase/fines/update/recalculate";
import { markFineItemsAsPaid } from "@/firebase/fines/update/fineItemsStatus";
import { PaymentMethod } from "@/features/organization/fees/types";
import { StudentFines } from "@/features/organization/fines/types";
import { PaymentFormData } from "@/lib/validators";
import { createOfflineProofOfPayment } from "./proofOfPayment";
import { PaymentStatus } from "@/constants/status";
import { PaymentMethods, PaymentType } from "@/constants/types";




export const addOnlineFinesPayment = async (fines: StudentFines, type:string, method: PaymentMethod, payRef?: string, senderNumber?:string) => {
    try {
        const subColRef = collection(db, type, fines.id!, "paymentHistory");
        const querySnapshot = await getCountFromServer(subColRef);

        let sequenceNumber = 0;
        querySnapshot.data().count ? sequenceNumber = querySnapshot.data().count + 1: sequenceNumber = 1;
        const proof = {
            userName: fines.userName,
            studentId: fines.studentId,
            amount: fines.balance,
            paymentMethod: method,
            referenceNumber: payRef || "",
            senderNumber: senderNumber || "",
            imageUrl: "",
            rejectionReason: "",
            notes: "",
        } as PaymentFormData;

        const proofId = await createOfflineProofOfPayment(proof, type);

        const paymentHist = await addDoc(subColRef, {
            paymentNumber: sequenceNumber,
            amount: fines.balance,
            paymentMethod: method,
            paymentProofId: proofId,
            gcashReference: payRef || null,
            status:PaymentStatus.PENDING,
            paidAt: Timestamp.now(), 
            verifiedBy: null,
            verifiedAt: null,
            rejectionReason: null,
            notes: `Offline payment of ${fines.balance} recorded for ${type}`,
            metaData: {},
            createdAt: Timestamp.now(),
        });
        await updateProofOfPaymentHistoryId(proofId!, paymentHist.id)
        
    } catch (error) {
        console.error("Error adding offline payment history:", error);
        throw new Error("Failed to add offline payment history. Please try again.");
    }
}





export const addOfflineFinesPayment = async (fines: StudentFines, type:string, method: PaymentMethod, payRef?: string, senderNumber?:string) => {
    const currentUser = await getCurrentUserData() as unknown as Member;
    try {
        const subColRef = collection(db, type, fines.id!, "paymentHistory");
        const querySnapshot = await getCountFromServer(subColRef);

        let sequenceNumber = 0;
        querySnapshot.data().count ? sequenceNumber = querySnapshot.data().count + 1: sequenceNumber = 1;
        const proof = {
            userName: fines.userName,
            studentId: fines.studentId,
            amount: fines.balance,
            paymentMethod: method,
            referenceNumber: payRef || "",
            senderNumber: senderNumber || "",
            imageUrl: "",
            rejectionReason: "",
            notes: "",
        } as PaymentFormData;

        const proofId = await createOfflineProofOfPayment(proof, type);

        const paymentHist = await addDoc(subColRef, {
            paymentNumber: sequenceNumber,
            amount: fines.balance,
            paymentMethod: method,
            paymentProofId: proofId,
            gcashReference: payRef || null,
            status:PaymentStatus.VERIFIED,
            paidAt: Timestamp.now(), 
            verifiedBy: currentUser.firstName + " " + currentUser.lastName,
            verifiedAt: Timestamp.now(),
            rejectionReason: null,
            notes: `Offline payment of ${fines.balance} recorded for ${type}`,
            metaData: {},
            createdAt: Timestamp.now(),
        });
            await updateProofOfPaymentHistoryId(proofId!, paymentHist.id)
        if (type === PaymentType.FINES) {
            await recalculateFines(fines.id!, null, fines.balance);
            await markFineItemsAsPaid(fines.id!);
        }
    } catch (error) {
        console.error("Error adding offline payment history:", error);
        throw new Error("Failed to add offline payment history. Please try again.");
    }
}

export const createFinesPaymentHistory = async (proof:PaymentFormData, referenceId:string, proofId:string) => {
    try {
        const current = await getCurrentUserData() as unknown as Member;
        const subColRef = collection(db, proof.type! , referenceId , "paymentHistory");
        const querySnapshot = await getCountFromServer(subColRef);

        let sequenceNumber = 0;
        querySnapshot.data().count ? sequenceNumber = querySnapshot.data().count + 1 : sequenceNumber = 1;
         const paymentHist = await addDoc(subColRef, {
            paymentNumber: sequenceNumber,
            amount: proof.amount,
            paymentMethod: proof.paymentMethod,
            paymentProofId: proofId,
            gcashReference: proof.referenceNumber || null,
            status:PaymentStatus.VERIFIED,
            paidAt: Timestamp.now(), 
            verifiedBy: current.firstName + " " + current.lastName,
            verifiedAt: Timestamp.now(),
            rejectionReason: null,
            notes: proof.notes || `Offline payment of ${proof.amount} recorded for ${proof.type}`,
            metaData: {},
            createdAt: Timestamp.now(),
        });
        if (proof.type! === PaymentType.FINES) {
            await recalculateFines(referenceId, null, proof.amount);
            await markFineItemsAsPaid(referenceId);
        }
        return paymentHist.id;
    }catch(error){
        console.error("Error creating fines payment history:", error);
        throw new Error("Failed to create fines payment history. Please try again.");
    }
}



