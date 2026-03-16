import { db } from "@/firebase/firebase.config";
import { addDoc, collection, doc, getCountFromServer, Timestamp, updateDoc } from "firebase/firestore";
import { getProofOfPaymentById } from "../read/proofOfPayment";
import { updateProofOfPaymentHistoryId } from "../update/proofOfPayment";
import { getCurrentUserData } from "@/firebase/users";
import { Member, MemberData } from "@/features/organization/members/types";
import { recalculateFines } from "@/firebase/fines/update/recalculate";
import { markFineItemsAsPaid } from "@/firebase/fines/update/fineItemsStatus";
import { PaymentMethod } from "@/features/organization/fees/types";
import { StudentFines } from "@/features/organization/fines/types";
import { PaymentFormData } from "@/lib/validators";
import { createOfflineFinesProofOfPayment } from "./proofOfPayment";
import { PaymentStatus } from "@/constants/status";
import { PaymentMethods, PaymentType } from "@/constants/types";
import { recalculateClearanceStatus } from "@/firebase/clearance";
import { recalculateFees } from "@/firebase/fees/update/recalculate";
import { UnpaidDue } from "@/features/organization/payments/types";
import { getFineItemsByFineId } from "@/firebase/fines/read/fines";

export const addOnlineFinesPayment = async (fines: StudentFines, type:string, method: PaymentMethod, payRef?: string, senderNumber?:string) => {
    try {
        const subColRef = collection(db, type, fines.id!, "paymentHistory");
        const querySnapshot = await getCountFromServer(subColRef);

        let fineItems = await getFineItemsByFineId(fines.id!);
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
        console.log("Creating proof of payment with data:--", proof);
        const proofId = await createOfflineFinesProofOfPayment(proof, type,fines,fineItems);

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
            metadata: {},
            createdAt: Timestamp.now(),
        });
        await updateProofOfPaymentHistoryId(proofId!, paymentHist.id)

        if (type === PaymentType.FINES) {
            const clearanceRef = doc(db, 'clearanceStatus', fines.userId);
            await updateDoc(clearanceRef, {
                [`blockingItems.${fines.id}.pendingReview`]: true,
            });
            await recalculateClearanceStatus(clearanceRef.id)
        }
        
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

        let fineItems = await getFineItemsByFineId(fines.id!);
        let sequenceNumber = 0;
        querySnapshot.data().count ? sequenceNumber = querySnapshot.data().count + 1 : sequenceNumber = 1;
        
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

        const proofId = await createOfflineFinesProofOfPayment(proof, type,fines, fineItems);

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
            metadata: {},
            createdAt: Timestamp.now(),
        });
            await updateProofOfPaymentHistoryId(proofId!, paymentHist.id)
        if (type === PaymentType.FINES) {
            await recalculateFines(fines.id!, null, fines.balance);
            await markFineItemsAsPaid(fines.id!);

            const clearanceRef = doc(db, 'clearanceStatus', fines.userId);
            await updateDoc(clearanceRef, {
                [`blockingItems.${fines.id}.balance`]: 0,
                [`blockingItems.${fines.id}.status`]: "paid",
                [`blockingItems.${fines.id}.pendingReview`]: false,
            });

            await recalculateClearanceStatus(clearanceRef.id)
        }

        return proofId;

    } catch (error) {
        console.error("Error adding offline payment history:", error);
        throw new Error("Failed to add offline payment history. Please try again.");
    }
}

export const createFinesPaymentHistory = async (
    proof: PaymentFormData,
    referenceId: string,
    proofId: string, 
    userId: string,
    paid?: UnpaidDue) => {
    try {
        const current = await getCurrentUserData() as unknown as Member;
        const subColRef = collection(db, paid?.type? paid.type : proof.type! , referenceId , "paymentHistory");
        const querySnapshot = await getCountFromServer(subColRef);

        let sequenceNumber = 0;
        querySnapshot.data().count ? sequenceNumber = querySnapshot.data().count + 1 : sequenceNumber = 1;
         const paymentHist = await addDoc(subColRef, {
            paymentNumber: sequenceNumber,
            amount: proof.amount,
            paymentMethod: proof.paymentMethod,
            paymentProofId: proofId,
            paymentType: proof.type!,
            gcashReference: proof.referenceNumber || null,
            status:PaymentStatus.VERIFIED,
            paidAt: Timestamp.now(), 
            verifiedBy: current.id!,
            verifiedByName: current.firstName + " " + current.lastName,
            verifiedAt: Timestamp.now(),
            rejectionReason: null,
            notes: proof.notes || `Offline payment of ${proof.amount} recorded for ${paid?.type? paid.type : proof.type!}`,
            metadata: {},
            createdAt: Timestamp.now(),
         });
        
        if ((paid?.type? paid.type : proof.type!) === "fines") {
            try {
                await recalculateFines(referenceId, null, paid?.balance);
                await markFineItemsAsPaid(referenceId, paid?.id);
            } catch (error) {
                console.error("Error updating fines after payment:", error);
                throw new Error("Payment recorded, but failed to update fines. Please check the fines record.");
            }
        }
        if ((paid?.type? paid.type : proof.type!) === "fees")
        {
            try {
                await recalculateFees(referenceId, paid?.balance);
            } catch (error) {
                console.error("Error updating fees after payment:", error);
                throw new Error("Payment recorded, but failed to update fees. Please check the fees record.");
            }
        }
        try {
            const clearanceRef = doc(db, 'clearanceStatus', userId);
            await updateDoc(clearanceRef, {
                [`blockingItems.${referenceId}.balance`]: 0,
                [`blockingItems.${referenceId}.status`]: "paid",
                [`blockingItems.${referenceId}.pendingReview`]: false,
            });

            await recalculateClearanceStatus(clearanceRef.id)
        }catch(error){
            console.error("Error updating clearance status after payment:", error);
            throw new Error("Payment recorded, but failed to update clearance status. Please check the clearance record.");
        }

        return paymentHist.id;
    }catch(error){
        console.error("Error creating fines payment history:", error);
        throw new Error("Failed to create fines payment history. Please try again.");
    }
}






export const createOnlinePaymentHistory = async (
    proof: PaymentFormData,
    referenceId: string,
    proofId: string,
    userId: string,
    paid?: {refId:string, title:string, amount:number, paymentType: string, parentFineId:string}) => {
    try {
        const current = await getCurrentUserData() as unknown as Member;
        const subColRef = collection(db, paid?.paymentType? paid.paymentType : proof.type! , referenceId , "paymentHistory");
        const querySnapshot = await getCountFromServer(subColRef);

        let sequenceNumber = 0;
        querySnapshot.data().count ? sequenceNumber = querySnapshot.data().count + 1 : sequenceNumber = 1;
         const paymentHist = await addDoc(subColRef, {
            paymentNumber: sequenceNumber,
            amount: proof.amount,
            paymentMethod: proof.paymentMethod,
            paymentProofId: proofId,
            paymentType: proof.type!,
            gcashReference: proof.referenceNumber || null,
            status:PaymentStatus.PENDING,
            paidAt: Timestamp.now(), 
            verifiedBy: current.id!,
            verifiedByName: current.firstName + " " + current.lastName,
            verifiedAt: Timestamp.now(),
            rejectionReason: null,
            notes: proof.notes || `Offline payment of ${proof.amount} recorded for ${paid?.paymentType? paid.paymentType : proof.type!}`,
            metadata: {},
            createdAt: Timestamp.now(),
         });
            if ((paid?.paymentType ? paid.paymentType : proof.type!) === "fines") { 
                try {
                     await updateDoc(doc(db, "fines", referenceId), {status: "pending"})
                }catch(error){
                    console.error("Error updating fines after payment:", error);
                    throw new Error("Payment recorded, but failed to update fines. Please check the fines record.");
                }
            }
        return paymentHist.id;
    }catch(error){
        console.error("Error creating fines payment history:", error);
        throw new Error("Failed to create fines payment history. Please try again.");
    }
}

