import { db } from "@/firebase/firebase.config";
import { addDoc, collection, doc, getCountFromServer, Timestamp, updateDoc } from "firebase/firestore";
import { getProofOfPaymentById, getAllProofOfPayments } from "../read/proofOfPayment";
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
import { getFineItemsByFineId, getAllFines, getAllUnpaidFinesforOrg } from "@/firebase/fines/read/fines";
import { cacheService, CACHE_KEYS } from "@/services/cacheService";
import { BlockingItem } from "@/features/organization/clearance/types";

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
        
        const orgId = fines.orgId || '';
        cacheService.invalidate(CACHE_KEYS.proofOfPayments(orgId));
        cacheService.invalidate(CACHE_KEYS.finesAll(orgId));
        cacheService.invalidate(CACHE_KEYS.finesUnpaid(orgId));
        cacheService.invalidate(CACHE_KEYS.feesForOrg(orgId));
        cacheService.invalidate(CACHE_KEYS.feesUnpaid(orgId));
        cacheService.invalidate(CACHE_KEYS.clearanceAll(orgId));
        
        // Pre-emptive warming
        getAllProofOfPayments(orgId).catch(console.error);
        getAllFines().catch(console.error);
        getAllUnpaidFinesforOrg().catch(console.error);
        
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
            for (const item of fineItems) {
                await updateDoc(clearanceRef, {
                [`blockingItems.${item.id}.balance`]: 0,
                [`blockingItems.${item.id}.status`]: "paid",
                [`blockingItems.${item.id}.pendingReview`]: false,
            });
            }

            await recalculateClearanceStatus(clearanceRef.id)
        }

        const orgId = fines.orgId || '';
        cacheService.invalidate(CACHE_KEYS.proofOfPayments(orgId));
        cacheService.invalidate(CACHE_KEYS.finesAll(orgId));
        cacheService.invalidate(CACHE_KEYS.finesUnpaid(orgId));
        cacheService.invalidate(CACHE_KEYS.feesForOrg(orgId));
        cacheService.invalidate(CACHE_KEYS.feesUnpaid(orgId));
        cacheService.invalidate(CACHE_KEYS.clearanceAll(orgId));
        
        // Pre-emptive warming
        getAllProofOfPayments(orgId).catch(console.error);
        getAllFines().catch(console.error);
        getAllUnpaidFinesforOrg().catch(console.error);
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
    paid?: BlockingItem) => {
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
        
        let reference = referenceId;
        
        if ((paid?.type? paid.type : proof.type!) === "fines") {
            try {
                await recalculateFines(referenceId, null, paid?.balance);
                await markFineItemsAsPaid(referenceId, paid?.referenceId);
                reference = paid?.referenceId!;
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
                [`blockingItems.${reference}.balance`]: 0,
                [`blockingItems.${reference}.status`]: "paid",
                [`blockingItems.${reference}.pendingReview`]: false,
            });

            await recalculateClearanceStatus(clearanceRef.id)
        }catch(error){
            console.error("Error updating clearance status after payment:", error);
            throw new Error("Payment recorded, but failed to update clearance status. Please check the clearance record.");
        }

        const orgId = current.id || '';
        cacheService.invalidate(CACHE_KEYS.proofOfPayments(orgId));
        cacheService.invalidate(CACHE_KEYS.finesAll(orgId));
        cacheService.invalidate(CACHE_KEYS.finesUnpaid(orgId));
        cacheService.invalidate(CACHE_KEYS.feesForOrg(orgId));
        cacheService.invalidate(CACHE_KEYS.feesUnpaid(orgId));
        cacheService.invalidate(CACHE_KEYS.clearanceAll(orgId));

        // Pre-emptive warming
        getAllProofOfPayments(orgId).catch(console.error);
        getAllFines().catch(console.error);
        getAllUnpaidFinesforOrg().catch(console.error);

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
            verifiedBy: "",
            verifiedByName: "",
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
        
        const user = await getCurrentUserData();
        const orgId = user?.uid || '';
        cacheService.invalidate(CACHE_KEYS.proofOfPayments(orgId));
        cacheService.invalidate(CACHE_KEYS.finesAll(orgId));
        cacheService.invalidate(CACHE_KEYS.finesUnpaid(orgId));
        cacheService.invalidate(CACHE_KEYS.feesForOrg(orgId));
        cacheService.invalidate(CACHE_KEYS.feesUnpaid(orgId));
        cacheService.invalidate(CACHE_KEYS.clearanceAll(orgId));

        // Pre-emptive warming
        if (orgId) {
            getAllFines().catch(console.error);
            getAllUnpaidFinesforOrg().catch(console.error);
        }

        return paymentHist.id;
    }catch(error){
        console.error("Error creating fines payment history:", error);
        throw new Error("Failed to create fines payment history. Please try again.");
    }
}
