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
                metaData: {},
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


export const createOfflineProofOfPayment = async (
    payment: PaymentFormData, type: string) => {
    let transaction
    const currentUser = await getCurrentUserData() as unknown as Member;
    try {
        console.log("Creating offline proof of payment for", payment, "of type", type);
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
                verifiedBy: currentUser.id!,
                verifiedByName: currentUser.firstName + " " + currentUser.lastName,
                verifiedAt: Timestamp.now(),
                receiptCode: generateReceiptId(),
            }
            console.log("Constructed payment data for offline proof:", paymentData);
            const docRef = await addDoc(collection(db, "proofOfPayments"), paymentData);
            console.log("Offline proof of payment created with ID:", docRef.id);
            return docRef.id;
        }
        
    } catch (error) {
        console.error("Error creating offline proof of payment:", error);
        throw new Error("Failed to submit proof of payment. Please try again.");
    }
}

export const createBulkOfflineProofOfPayment = async (
  payments: PaymentFormData[],
  receipt: string,
  fees: Fee[]
) => {
  const currentUser = await getCurrentUserData() as unknown as Member;
  const bulkId = `BULK-${nanoid(10)}`;
  const verifierName = `${currentUser.firstName} ${currentUser.lastName}`;
  const now = Timestamp.now();


  const finePayments = payments.filter(p => p.type === "fines");
  const feePayments  = payments.filter(p => p.type === "fees");

  const fineTransactions = await Promise.all(
    finePayments.map(p => getFineByStudentId(p.studentId))
  );

  const feesPool = [...fees]; 
  const feeTransactions = feePayments.map(payment => {
    const index = feesPool.findIndex(f => f.id === payment.referenceId);
    if (index === -1) return null;
    return feesPool.splice(index, 1)[0]; 
  });

  const batch = writeBatch(db);
  const docRefs: string[] = [];

  // used to link proof and history after batch
  const fineHistoryLinks: Record<string, string> = {};

  const feeTasks: Array<() => Promise<void>> = [];

  // Process fines
  for (let i = 0; i < finePayments.length; i++) {
    const payment     = finePayments[i];
    const transaction = fineTransactions[i];
    if (!transaction) continue;

    const docRef = doc(collection(db, "proofOfPayments"));
    docRefs.push(docRef.id);

    batch.set(docRef, buildPaymentData(payment, transaction, currentUser.id!, verifierName, bulkId, receipt, now));

    const historyId = await createFinesPaymentHistory(payment, transaction.id!, docRef.id);
    fineHistoryLinks[docRef.id] = historyId;
  }

  // Process fees
  for (let i = 0; i < feePayments.length; i++) {
    const payment     = feePayments[i];
    const transaction = feeTransactions[i];
    if (!transaction) continue;

    feeTasks.push(() =>
      recordManualPaymentAndUpdateClearance(
        transaction.id!,
        payment.amount.toLocaleString(),
        payment.paymentMethod as "gcash" | "cash" | "bank_transfer" | "waiver",
        currentUser.id!,
        transaction.userId,
        verifierName,
      ).then(() => {})
    );
  }


  for (const [proofId, historyId] of Object.entries(fineHistoryLinks)) {
    batch.update(doc(db, "proofOfPayments", proofId), {
      paymentHistoryId: historyId,
      updatedAt: now,
    });
  }

  await batch.commit();

  await Promise.all(feeTasks.map(task => task()));

  return docRefs;
};

//  Helper
function buildPaymentData(
  payment: PaymentFormData,
  transaction: { orgId: string; userId: string; id?: string },
  verifiedBy: string,
  verifiedByName: string,
  bulkId: string,
  receipt: string,
  now: Timestamp,
) {
  return {
    ...payment,
    orgId:          transaction.orgId,
    userId:         transaction.userId,
    referenceId:    transaction.id,
    paymentType:    payment.type,
    status:         PaymentStatus.VERIFIED,
    submittedAt:    now,
    metaData:       {},
    verifiedBy,
    verifiedByName,
    verifiedAt:     now,
    bulkPaymentId:  bulkId,
    receiptCode:    receipt,
  };
}









































