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
import { getCurrentUserData } from "@/firebase/users";
import { Member } from "@/features/organization/members/types";
import { createFinesPaymentHistory } from "./paymentHistory";
import { UnpaidDue } from "@/features/organization/payments/types";
import { FineItem, StudentFines } from "@/features/organization/fines/types";

export const createOnlineProofOfPayment = async (
    payment: PaymentFormData, type: string ) => {

    let transaction;
    const currentUser = await getCurrentUserData() as unknown as Member;
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
                paymentType:payment.type,
                status: PaymentStatus.PENDING,
                submittedAt: Timestamp.now(),
                metadata: {},
                verifiedBy: currentUser.id!,
                verifiedByName: currentUser.firstName + " " + currentUser.lastName,
                verifiedAt: Timestamp.now(),
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


export const createOfflineFinesProofOfPayment = async (
  payment: PaymentFormData, type: string, fine: StudentFines, fineItems?: FineItem[]) => {
  const items = [];
    const currentUser = await getCurrentUserData() as unknown as Member;
    try {
      const transaction = await getFineByStudentId(payment.studentId);
      for (const item of fineItems ?? []) { 
        items.push({
          refId: item.id,
          title: item.eventName,
          amount: item.amount,
          paymentType: type,
          parentFineId: fine.id!,
          })
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
                metadata: {
                  items: items,
                },
                verifiedBy: currentUser.id!,
                verifiedByName: currentUser.firstName + " " + currentUser.lastName,
                verifiedAt: Timestamp.now(),
                receiptCode: generateReceiptId(),
            }

            const docRef = await addDoc(collection(db, "proofOfPayments"), paymentData);
            return docRef.id;
        }
        
    } catch (error) {
        console.error("Error creating offline proof of payment:", error);
        throw new Error("Failed to submit proof of payment. Please try again.");
    }
}

export const createBulkOfflineProofOfPayment = async (
  payment: PaymentFormData,
  receipt: string,
  dues: UnpaidDue[],
  userId: string,
) => {
  const currentUser = await getCurrentUserData() as unknown as Member;
  const verifierName = `${currentUser.firstName} ${currentUser.lastName}`;
  const paymentData = {
    ...payment,
    orgId: currentUser.id!,
    userId: userId,
    paymentType: payment.type,
    status: PaymentStatus.VERIFIED,
    submittedAt: Timestamp.now(),
    metadata: {},
    verifiedBy: currentUser.id!,
    verifiedByName: verifierName,
    verifiedAt: Timestamp.now(),
    receiptCode: receipt,
  }
  const ref = collection(db, "proofOfPayments");
  const docRef = await addDoc(ref, paymentData);
  const items = [];
  for (const due of dues) {
    await createFinesPaymentHistory(payment, due.parentId!, docRef.id, userId, due);
    items.push({
      refId: due.id,
      title: due.name,
      amount: due.balance,
      paymentType: due.type,
      parentFineId: due.type === "fines" ? due.parentId : "",
    })
  }
  await updateDoc(doc(db, "proofOfPayments", docRef.id), {
      metadata: {
        items: items,
      }
    } )
}