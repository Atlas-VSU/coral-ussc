import { PaymentStatus } from "@/constants/status";
import { getFineByStudentId} from "@/firebase/fines/read/fines";
import { db } from "@/firebase/firebase.config";
import { PaymentFormData } from "@/lib/validators";
import { addDoc, collection, doc, getDoc, Timestamp, updateDoc } from "firebase/firestore";


import { generateReceiptId } from "@/features/organization/payments/utils";
import { getFeeByStudentId } from "@/firebase/fees";
import { getCurrentUserData } from "@/firebase/users";
import { Member } from "@/features/organization/members/types";
import { createFinesPaymentHistory, createOnlinePaymentHistory } from "./paymentHistory";
import { FineItem, StudentFines } from "@/features/organization/fines/types";
import { cacheService, CACHE_KEYS } from "@/services/cacheService";
import { BlockingItem } from "@/features/organization/clearance/types";
import { updateFeeStats, updateFineStats } from "@/firebase/stats/update/updateStats";
import { getActiveTerm } from "@/firebase/term";

export const createOnlineProofOfPayment = async (
    payment: PaymentFormData, type: string ) => {

    let transaction: any;
    const currentUser = await getCurrentUserData() as unknown as Member;
    const term = await getActiveTerm();
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
                academicYear: term!.AY,
                semester: term!.semester,
                status: PaymentStatus.PENDING,
                submittedAt: Timestamp.now(),
                metadata: {
                    items: [{
                        refId: transaction.id,
                        title: payment.notes || (type === "fines" ? "Fine Payment" : "Fee Payment"),
                        amount: payment.amount,
                        paymentType: type,
                        parentFineId: type === "fines" ? (transaction.id || "") : "",
                        academicYear: type === "fees" ? transaction.academicYear : term!.AY,
                        semester: type === "fees" ? transaction.semester : term!.semester,
                    }]
                },
                itemKeys: [
                    type === "fees" ? transaction.feeType : transaction.id,
                ],
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
            // cacheService.invalidate(CACHE_KEYS.feesForOrg(orgId));
            // cacheService.invalidate(CACHE_KEYS.feesUnpaid(orgId));
            // cacheService.invalidate(CACHE_KEYS.clearanceAll(orgId));
            

            return docRef.id;
        }
        
    }catch(error){
        console.error("Error creating online proof of payment:", error);
        throw new Error("Failed to submit proof of payment. Please try again.");
    }
}


// export const createBulkOnlineProofOfPayment = async (
//   payment: PaymentFormData,
//   dues: {refId: string, title: string, amount: number, paymentType: string, parentFineId: string}[],
//   userId: string,
// ) => {
//   const currentUser = await getCurrentUserData() as unknown as Member;
//   // const tempOrgIdForStudents = "5nii7NKwaiTM0ZigxVBcUzQTyTu2"; //hardcoded for now since wala paman sila portal, necessary man ang ordId sa queries
  
//   try {
//       const paymentData = {
//         ...payment,
//         orgId: currentUser.orgId!,
//         userId: userId,
//         paymentType: payment.type,
//         status: PaymentStatus.PENDING,
//         submittedAt: Timestamp.now(),
//         metadata: {},
//         verifiedBy:"",
//         verifiedByName: "",
//         verifiedAt: null,
//         isArchived: false,
//         updatedAt: Timestamp.now(),
//       }
//       const ref = collection(db, "proofOfPayments");
//       const docRef = await addDoc(ref, paymentData);
//       const items = [];
      
//     for (const due of dues) {
//       let referenceId = "";
//       if (due.paymentType === "fines") {
//         referenceId = due.parentFineId;
//       }
//       else if (due.paymentType === "fees") {
//         referenceId = due.refId;
//        }
//         await createOnlinePaymentHistory(payment, referenceId, docRef.id, userId, due);
//         const clearanceRef = doc(db, 'clearanceStatus', userId);
//         await updateDoc(clearanceRef, {
//           [`blockingItems.${due.refId}.pendingReview`]: true,
//         })
//         let academicYear = "2025-2026";
//         let semester = "2nd";
        
//         if (due.paymentType === "fees") {
//           const feeDoc = await getDoc(doc(db, "fees", due.refId));
//           if (feeDoc.exists()) {
//             const feeData = feeDoc.data();
//             academicYear = feeData.academicYear;
//             semester = feeData.semester;
//           }
//         }

//         items.push({
//           refId: due.refId || null,
//           title: due.title || null,
//           amount: due.amount || null,
//           paymentType: due.paymentType || null,
//           parentFineId: due.paymentType === "fines" ? due.parentFineId : "",
//           academicYear,
//           semester,
//         })
//     }
//         await updateDoc(doc(db, "clearanceStatus", userId), { status: "pending" });
    
//         await updateDoc(doc(db, "proofOfPayments", docRef.id), {
//           metadata: {
//             items: items,
//           }
//         })

//         const orgId = currentUser.orgId || '';
//         // cacheService.invalidate(CACHE_KEYS.feesForOrg(orgId));
//         // cacheService.invalidate(CACHE_KEYS.feesUnpaid(orgId));
//         // cacheService.invalidate(CACHE_KEYS.clearanceAll(orgId));
        

//     return [{ success: true, message: "Proof of payment submitted successfully." }];
//   }catch(error) {
//     console.error("Error creating bulk online proof of payment:", error);
//     return [{ success: false, message: "Failed to submit proof of payment. Please try again." }, {status: 500}];
//   }
// }


export const createOfflineFinesProofOfPayment = async (
  payment: PaymentFormData, type: string, fine: StudentFines, fineItems?: FineItem[]) => {
  const items = [];
    const currentUser = await getCurrentUserData() as unknown as Member;
    try {
      const transaction = await getFineByStudentId(payment.studentId);
      const term = await getActiveTerm();
      
      for (const item of fineItems?.filter(f => !f.isPaid) ?? []) { 
        items.push({
          refId: item.id,
          title: item.eventName,
          amount: item.amount,
          paymentType: type,
          parentFineId: fine.id!,
          academicYear: term!.AY,
          semester: term!.semester,
        })
        if (type === "fines") { 
          await updateFineStats(`${term!.AY}-${term!.semester}-${currentUser.orgId}`, 0, item.amount);
        }
        if (type === "fees") {
          await updateFeeStats(`${term!.AY}-${term!.semester}-${currentUser.orgId}`, 0, item.amount);
        }
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
                academicYear: term!.AY,
                semester: term!.semester,
                metadata: {
                  items: items,
                },
                itemKeys: items.map(item => item.refId),
                verifiedBy: currentUser.id!,
                verifiedByName: currentUser.firstName + " " + currentUser.lastName,
                verifiedAt: Timestamp.now(),
                receiptCode: generateReceiptId(),
                isArchived: false,
                updatedAt: Timestamp.now(),
            }

            const docRef = await addDoc(collection(db, "proofOfPayments"), paymentData);
            
            const orgId = transaction.orgId || '';
            // cacheService.invalidate(CACHE_KEYS.feesForOrg(orgId));
            // cacheService.invalidate(CACHE_KEYS.feesUnpaid(orgId));
            // cacheService.invalidate(CACHE_KEYS.clearanceAll(orgId));
            

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
  dues: BlockingItem[],
  userId: string,
  date?: Timestamp,
  feeItemKeys?: string[],
) => {
  const currentUser = await getCurrentUserData() as unknown as Member;
  const term = await getActiveTerm();
  const verifierName = `${currentUser.firstName} ${currentUser.lastName}`;
  const paymentData = {
    ...payment,
    orgId: currentUser.orgId!,
    userId: userId,
    paymentType: payment.type,
    status: PaymentStatus.VERIFIED,
    submittedAt: Timestamp.now(),
    academicYear: term!.AY,
    semester: term!.semester,
    metadata: {},
    verifiedBy: currentUser.id!,
    verifiedByName: verifierName,
    verifiedAt: date? date : Timestamp.now(),
    receiptCode: receipt,
    isArchived: false,
    updatedAt: Timestamp.now(),
  }
  const ref = collection(db, "proofOfPayments");
  const docRef = await addDoc(ref, paymentData);
  const items = [];
  for (const due of dues.filter(d => d.status === "unpaid")) {
    await createFinesPaymentHistory(payment, due.parentFineId?due.parentFineId:due.referenceId, docRef.id, userId, due);
    items.push({
      refId: due.referenceId,
      title: due.title,
      amount: due.balance,
      paymentType: due.type,
      parentFineId: due.type === "fines" ? due.parentFineId : "",
      academicYear: term!.AY,
      semester: term!.semester,
    })
    
    // If it's a fee, we should try to get the actual academic year and semester if possible
    if (due.type === "fees") {
       const feeDoc = await getDoc(doc(db, "fees", due.referenceId));
       if (feeDoc.exists()) {
         const feeData = feeDoc.data();
         const lastItem = items[items.length - 1];
         lastItem.academicYear = feeData.academicYear;
         lastItem.semester = feeData.semester;
       }
    }

    if (due.type === "fines") { 
        await updateFineStats(`${term!.AY}-${term!.semester}-${currentUser.orgId}`, 0, due.balance);
    }
    if (due.type === "fees") {
        await updateFeeStats(`${term!.AY}-${term!.semester}-${currentUser.orgId}`, 0, due.balance);
    }
  }
  await updateDoc(doc(db, "proofOfPayments", docRef.id), {
      metadata: {
        items: items,
      },
      itemKeys: feeItemKeys,
    } )

    const orgId = currentUser.id || '';
    // cacheService.invalidate(CACHE_KEYS.feesForOrg(orgId));
    // cacheService.invalidate(CACHE_KEYS.feesUnpaid(orgId));
    // cacheService.invalidate(CACHE_KEYS.clearanceAll(orgId));
    
}