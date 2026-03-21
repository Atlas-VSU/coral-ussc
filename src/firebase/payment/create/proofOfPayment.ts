import { PaymentStatus } from "@/constants/status";
import { getFineByStudentId, getAllFines, getAllUnpaidFinesforOrg } from "@/firebase/fines/read/fines";
import { db } from "@/firebase/firebase.config";
import { PaymentFormData } from "@/lib/validators";
import { addDoc, collection, doc, Timestamp, updateDoc } from "firebase/firestore";


import { generateReceiptId } from "@/features/organization/payments/utils";
import { getFeeByStudentId } from "@/firebase/fees";
import { getCurrentUserData } from "@/firebase/users";
import { Member } from "@/features/organization/members/types";
import { createFinesPaymentHistory, createOnlinePaymentHistory } from "./paymentHistory";
import { UnpaidDue } from "@/features/organization/payments/types";
import { FineItem, StudentFines } from "@/features/organization/fines/types";
import { cacheService, CACHE_KEYS } from "@/services/cacheService";
import { getAllProofOfPayments } from "../read/proofOfPayment";

export const createOnlineProofOfPayment = async (
    payment: PaymentFormData, type: string ) => {

    let transaction: any;
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
                isArchived: false,
                updatedAt: Timestamp.now(),
            }
            if (payment.paymentHistoryId) {
                (paymentData as any).paymentHistoryId = payment.paymentHistoryId;
            }
            const docRef = await addDoc(collection(db, "proofOfPayments"), paymentData);
            
            const orgId = transaction.orgId || '';
            cacheService.invalidate(CACHE_KEYS.proofOfPayments(orgId));
            cacheService.invalidate(CACHE_KEYS.finesAll(orgId));
            cacheService.invalidate(CACHE_KEYS.finesUnpaid(orgId));
            cacheService.invalidate(CACHE_KEYS.feesForOrg(orgId));
            cacheService.invalidate(CACHE_KEYS.feesUnpaid(orgId));
            cacheService.invalidate(CACHE_KEYS.clearanceAll(orgId));
            
            getAllProofOfPayments(orgId).catch(console.error);

            return docRef.id;
        }
        
    }catch(error){
        console.error("Error creating online proof of payment:", error);
        throw new Error("Failed to submit proof of payment. Please try again.");
    }
}


export const createBulkOnlineProofOfPayment = async (
  payment: PaymentFormData,
  dues: {refId: string, title: string, amount: number, paymentType: string, parentFineId: string}[],
  userId: string,
) => {

  const tempOrgIdForStudents = "5nii7NKwaiTM0ZigxVBcUzQTyTu2"; //hardcoded for now since wala paman sila portal, necessary man ang ordId sa queries
  
  try {
      const paymentData = {
        ...payment,
        orgId: tempOrgIdForStudents,
        userId: userId,
        paymentType: payment.type,
        status: PaymentStatus.PENDING,
        submittedAt: Timestamp.now(),
        metadata: {},
        verifiedBy:"",
        verifiedByName: "",
        verifiedAt: null,
        isArchived: false,
        updatedAt: Timestamp.now(),
      }
      const ref = collection(db, "proofOfPayments");
      const docRef = await addDoc(ref, paymentData);
      const items = [];
      
    for (const due of dues) {
      let referenceId = "";
      if (due.paymentType === "fines") {
        referenceId = due.parentFineId;
      }
      else if (due.paymentType === "fees") {
        referenceId = due.refId;
       }
        await createOnlinePaymentHistory(payment, referenceId, docRef.id, userId, due);
        const clearanceRef = doc(db, 'clearanceStatus', userId);
        await updateDoc(clearanceRef, {
          [`blockingItems.${due.refId}.pendingReview`]: true,
        })
        items.push({
          refId: due.refId || null,
          title: due.title || null,
          amount: due.amount || null,
          paymentType: due.paymentType || null,
          parentFineId: due.paymentType === "fines" ? due.parentFineId : "",
        })
    }
        await updateDoc(doc(db, "clearanceStatus", userId), { status: "pending" });
    
        await updateDoc(doc(db, "proofOfPayments", docRef.id), {
          metadata: {
            items: items,
          }
        })

        const orgId = tempOrgIdForStudents;
        cacheService.invalidate(CACHE_KEYS.proofOfPayments(orgId));
        cacheService.invalidate(CACHE_KEYS.finesAll(orgId));
        cacheService.invalidate(CACHE_KEYS.finesUnpaid(orgId));
        cacheService.invalidate(CACHE_KEYS.feesForOrg(orgId));
        cacheService.invalidate(CACHE_KEYS.feesUnpaid(orgId));
        cacheService.invalidate(CACHE_KEYS.clearanceAll(orgId));
        
        getAllProofOfPayments(orgId).catch(console.error);

    return [{ success: true, message: "Proof of payment submitted successfully." }];
  }catch(error) {
    console.error("Error creating bulk online proof of payment:", error);
    return [{ success: false, message: "Failed to submit proof of payment. Please try again." }, {status: 500}];
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
                isArchived: false,
                updatedAt: Timestamp.now(),
            }

            const docRef = await addDoc(collection(db, "proofOfPayments"), paymentData);
            
            const orgId = transaction.orgId || '';
            cacheService.invalidate(CACHE_KEYS.proofOfPayments(orgId));
            cacheService.invalidate(CACHE_KEYS.finesAll(orgId));
            cacheService.invalidate(CACHE_KEYS.finesUnpaid(orgId));
            cacheService.invalidate(CACHE_KEYS.feesForOrg(orgId));
            cacheService.invalidate(CACHE_KEYS.feesUnpaid(orgId));
            cacheService.invalidate(CACHE_KEYS.clearanceAll(orgId));
            
            getAllProofOfPayments(orgId).catch(console.error);

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
    isArchived: false,
    updatedAt: Timestamp.now(),
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

    const orgId = currentUser.id || '';
    cacheService.invalidate(CACHE_KEYS.proofOfPayments(orgId));
    cacheService.invalidate(CACHE_KEYS.finesAll(orgId));
    cacheService.invalidate(CACHE_KEYS.finesUnpaid(orgId));
    cacheService.invalidate(CACHE_KEYS.feesForOrg(orgId));
    cacheService.invalidate(CACHE_KEYS.feesUnpaid(orgId));
    cacheService.invalidate(CACHE_KEYS.clearanceAll(orgId));
    
    getAllProofOfPayments(orgId).catch(console.error);
    getAllFines().catch(console.error);
    getAllUnpaidFinesforOrg().catch(console.error);
}