import { db } from "@/firebase/firebase.config";
import { addDoc, collection, getCountFromServer, Timestamp } from "firebase/firestore";
import { getProofOfPaymentById } from "../read/proofOfPayment";
import { updateProofOfPaymentHistoryId } from "../update/proofOfPayment";
import { getCurrentUserData } from "@/firebase/users";
import { Member, MemberData } from "@/features/organization/members/types";
import { recalculateFines } from "@/firebase/fines/update/recalculate";
import { PaymentStatus } from "@/constants/status";
import { PaymentMethods, PaymentType } from "@/constants/types";
import { markFineItemsAsPaid } from "@/firebase/fines/update/fineItemsStatus";
import { PaymentMethod } from "@/features/organization/fees/types";



const currentUser = await getCurrentUserData() as unknown as Member;

export const addOnlinePayment = async (proofOfPaymentId: string) => {
    try {
        const payment = await getProofOfPaymentById(proofOfPaymentId);
        if (!payment) {
            throw new Error("Proof of payment not found.");
        }
        const subColRef = collection(db, payment!.paymentType, payment!.referenceId, "paymentHistory");
        const querySnapshot = await getCountFromServer(subColRef);
        let sequenceNumber = 0;
        querySnapshot.data().count ? sequenceNumber = querySnapshot.data().count + 1: sequenceNumber = 1;

        const paymentHistory = await addDoc(subColRef, {
            paymentNumber: sequenceNumber,
            amount: payment.amount,
            paymentMethod: PaymentMethods.GCASH, // Assuming all online payments are through GCash. Since mao ni ang girequire na data sa fields
            paymentProofId: proofOfPaymentId,
            gcashReference: payment.referenceNumber,
            status: PaymentStatus.PENDING,
            paidAt: payment.submittedAt, 
            notes: `Payment of ${payment.amount} submitted for ${payment.paymentType} with reference ID ${payment.referenceId}.`,
            metaData: {
                createdAt: Timestamp.now(),
            }
        });
        await updateProofOfPaymentHistoryId(proofOfPaymentId,paymentHistory.id);
    } catch (error) {
        console.error("Error adding payment history:", error);
        throw new Error("Failed to add payment history. Please try again.");
    }
}

export const addOfflinePayment = async (amount: number, type: string, typeId: string, method: PaymentMethod ) => {
    try {
        const subColRef = collection(db, type, typeId, "paymentHistory");
        const querySnapshot = await getCountFromServer(subColRef);

        let sequenceNumber = 0;
        querySnapshot.data().count ? sequenceNumber = querySnapshot.data().count + 1: sequenceNumber = 1;

        // const verifier = await getCurrentUserData() as ;
        // console.log("Verifier data:", verifier.firstName);

        await addDoc(subColRef, {
            paymentNumber: sequenceNumber,
            amount: amount,
            paymentMethod: method,
            paymentProofId: null,
            gcashReference: null,
            status: PaymentStatus.VERIFIED,
            paidAt: Timestamp.now(), 
            verifiedBy: currentUser.firstName + " " + currentUser.lastName,
            verifiedAt: Timestamp.now(),
            rejectionReason: null,
            notes: `Offline payment of ${amount} recorded for ${type}`,
            metaData: {
                createdAt: Timestamp.now(),
            }
        });

        if (type === PaymentType.FINES) {
            await recalculateFines(typeId, null, amount);
            await markFineItemsAsPaid(typeId);
        }
    } catch (error) {
        console.error("Error adding offline payment history:", error);
        throw new Error("Failed to add offline payment history. Please try again.");
    }
}



