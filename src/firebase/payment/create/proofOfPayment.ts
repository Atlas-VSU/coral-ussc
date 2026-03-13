import { PaymentStatus } from "@/constants/status";
import { getFineByStudentId } from "@/firebase/fines/read/fines";
import { db } from "@/firebase/firebase.config";
import { PaymentFormData } from "@/lib/validators";
import { addDoc, collection, doc, Timestamp, updateDoc, writeBatch } from "firebase/firestore";

import { updateProofOfPaymentHistoryId } from "../update/proofOfPayment";
import { nanoid } from 'nanoid';
import { Fee } from "@/features/organization/fees/types";
import { generateReceiptId } from "@/features/organization/payments/utils";
import { getFeeByStudentId, recordManualPaymentAndUpdateClearance } from "@/firebase/fees";
import { useAuth } from "@/hooks/useAuth";
import { createFinesPaymentHistory } from "./paymentHistory";

export const createOnlineProofOfPayment = async (
    payment: PaymentFormData, type: string ) => {

    let transaction;
    try{
         if (type === "fines") {
            transaction = await getFineByStudentId(payment.studentId);
        } else if (type === "fees") {
            transaction = await getFeeByStudentId(payment.studentId);
        }
        if (transaction)
        {
            const paymentData = {
                ...payment,
                orgId: transaction.orgId,
                userId: transaction.userId,
                referenceId: transaction.id,
                paymentType:type,
                status: PaymentStatus.PENDING,
                submittedAt: Timestamp.now(),
                metaData: {},
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            }
            if (payment.paymentHistoryId) {
                (paymentData as any).paymentHistoryId = payment.paymentHistoryId;
            }
            const docRef = await addDoc(collection(db, "proofOfPayments"), paymentData);
            return docRef.id;
        }
        
    }catch{
        throw new Error("Failed to submit proof of payment. Please try again.");
    }
}


export const createOfflineProofOfPayment = async (
    payment: PaymentFormData, type: string) => {
        let transaction
    try {
        if (type === "fines") {
            transaction = await getFineByStudentId(payment.studentId);
        } else if (type === "fees") {
            transaction = await getFeeByStudentId(payment.studentId);
        }
        if (transaction)
        {
            const paymentData = {
                ...payment,
                orgId: transaction.orgId,
                userId: transaction.userId,
                referenceId: transaction.id,
                paymentType:type,
                status: PaymentStatus.VERIFIED,
                submittedAt: Timestamp.now(),
                metaData: {},
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                receiptCode: generateReceiptId(),
            }
            const docRef = await addDoc(collection(db, "proofOfPayments"), paymentData);
            return docRef.id;
        }
        
    }catch{
        throw new Error("Failed to submit proof of payment. Please try again.");
    }
}

export const createBulkOfflineProofOfPayment = async (payments: PaymentFormData[], receipt:string, fees: Fee[]) => {
    try{
        const batch = writeBatch(db);
        const docRefs: string[] = [];
        const paymentHistories: Record<string, string> = {};
        const feesCopy = fees;
        for (const payment of payments) {
            let transaction;
            const bulkId = `BULK-${nanoid(10)}`;
            if (payment.type === "fines") {
                transaction = await getFineByStudentId(payment.studentId);

            } else if (payment.type === "fees") {
                transaction = feesCopy.find(fee => fee.amount === payment.amount);
                feesCopy.splice(feesCopy.indexOf(transaction!), 1);
            }
            if (transaction) {
                const paymentData = {
                    ...payment,
                    orgId: transaction.orgId,
                    userId: transaction.userId,
                    referenceId: transaction.id,
                    paymentType:payment.type,
                    status: PaymentStatus.VERIFIED,
                    submittedAt: Timestamp.now(),
                    metaData: {},
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                    bulkPaymentId: bulkId,
                    receiptCode: receipt,
                };
                const docRef = doc(collection(db, "proofOfPayments"));
                batch.set(docRef, paymentData);
                docRefs.push(docRef.id);

                if(payment.type === "fees"){
                    const currentUser = useAuth();
                    await recordManualPaymentAndUpdateClearance(transaction.id!, payment.amount.toLocaleString(), payment.paymentMethod as "gcash" | "cash" | "bank_transfer" | "waiver", currentUser.user?.uid!,transaction.userId, currentUser.user?.firstName + " " + currentUser.user?.lastName);
                }

                if(payment.type === "fines"){
                    paymentHistories[docRef.id] = await createFinesPaymentHistory(payment, transaction.id!, docRef.id);
                }

            }

        }
        await batch.commit();
        for (const proofId in paymentHistories) {
            const historyId = paymentHistories[proofId];
            await updateProofOfPaymentHistoryId(proofId, historyId)
        }

        return docRefs;
        
    } catch(error){ 

        throw new Error("Failed to submit proof of payment. Please try again.");
    }
 }