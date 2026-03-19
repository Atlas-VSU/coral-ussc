import { collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, Timestamp, updateDoc, where, writeBatch } from "firebase/firestore";
import { db } from "./firebase.config";
import { BlockingItem, ClearanceStatus } from "@/features/organization/clearance/types";
import { approvePaymentTransaction, checkFeeStatusForClearance, fetchFee, recordBulkManualPaymentAndUpdateClearance, recordManualPaymentAndUpdateClearance, rejectPaymentTransaction } from "./fees";
import { Fee, FeeWithPaymentHistory, PaymentMethod } from "@/features/organization/fees/types";
import { getFineById, getFineByStudentId } from "./fines/read/fines";
import { ProofOfPayment, StudentFines } from "@/features/organization/fines/types";
import { PaymentType } from "@/constants/types";
import { rejectPaymentHistory, verifyPaymentHistory } from "./payment/update/paymentHistory";
import { PaymentStatus } from "@/constants/status";
import { addOfflineFinesPayment } from "./payment/create/paymentHistory";
import { toast } from "sonner";
import { getProofOfPaymentByUserId } from "./payment/read/proofOfPayment";
import { use } from "react";
import { cacheService, CACHE_KEYS, CACHE_DURATIONS } from "@/services/cacheService";
import { usePaymentApproval } from "@/features/organization/payments/hooks/usePaymentApproval";
export const fetchClearanceDocuments = async (orgId: string) => {
    return cacheService.getOrFetch(
        CACHE_KEYS.clearanceAll(orgId),
        async () => {
            const clearanceRef = collection(db, 'clearanceStatus');
            const q = query(
                clearanceRef, 
                where('orgId', '==', orgId), 
                where('isArchived', '==', false),
                orderBy('updatedAt', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            })) as ClearanceStatus[];
        },
        CACHE_DURATIONS.CLEARANCE
    );
}

export const fetchClearanceStatus = async (userId: string) => {
    return cacheService.getOrFetch(
        CACHE_KEYS.clearanceDoc(userId),
        async () => {
            const docRef = doc(db, 'clearanceStatus', userId);
            const snapshot = await getDoc(docRef);
            if (snapshot.exists()) {
                return { id: snapshot.id, ...snapshot.data() } as ClearanceStatus;
            }
            return null;
        },
        CACHE_DURATIONS.CLEARANCE
    );
}

/**
 * Recalculates and updates the overall status of a clearance document based on its blocking items.
 */
export const recalculateClearanceStatus = async (clearanceId: string) => {
    const clearanceRef = doc(db, 'clearanceStatus', clearanceId);
    const snapshot = await getDoc(clearanceRef);
    const clearance = snapshot.data() as ClearanceStatus;

    if (!clearance) return;

    let status: 'cleared' | 'pending' | 'not_cleared' = 'cleared';
    const items = Object.values(clearance.blockingItems || {});

    const hasUnpaidRequiredItems = items.some(item => 
        (item.status === 'unpaid' || item.balance > 0) && item.isRequiredForClearance
    );

    if (hasUnpaidRequiredItems) {
        const hasPendingReview = items.some(item => 
            (item.status === 'unpaid' || item.balance > 0) && item.isRequiredForClearance && item.pendingReview
        );
        status = hasPendingReview ? 'pending' : 'not_cleared';
    }

    const now = serverTimestamp();
    await updateDoc(clearanceRef, {
        status,
        updatedAt: now,
        clearanceDate: status === 'cleared' ? now : null
    });

    cacheService.invalidate(CACHE_KEYS.clearanceDoc(clearanceId));
    cacheService.invalidate(CACHE_KEYS.clearanceAll(clearance.orgId));
    fetchClearanceDocuments(clearance.orgId).catch(console.error);
}

export const updateClearanceDocument = async (userId: string, orgId: string) => {
    let blockingItems: Record<string, BlockingItem> = {};
    
    const fees = await checkFeeStatusForClearance(userId, orgId) as FeeWithPaymentHistory[];
    
    fees.forEach((fee: FeeWithPaymentHistory) => {
        blockingItems[fee.id] = {
            type: fee.feeType as PaymentType,
            referenceId: fee.id,
            title: fee.title,
            balance: fee.balance,
            status: fee.status as "unpaid" | "paid",
            paymentHistory: fee.paymentHistory,
            pendingReview: fee.paymentHistory.some(payment => payment.status === "pending"),
            isRequiredForClearance: fee.isRequiredForClearance,
        };
    });

    // logic here for fines generating blocking items
    const fine = await getFineByStudentId(userId);
    if (fine && fine.balance > 0) {
        blockingItems[fine.id!] = {
            type: PaymentType.FINES,
            referenceId: fine.id!,
            title: "Fines",
            balance: fine.balance,
            status: fine.status as "unpaid" | "paid",
            paymentHistory: [], // Payment history for fines is stored in a subcollection, not aggregated here for now
            pendingReview: fine.status === "pending" || fine.status === "pending",
            isRequiredForClearance: true, // Fines are usually required for clearance
        };
    }

    const clearanceRef = doc(db, 'clearanceStatus', userId);
    await updateDoc(clearanceRef, {
        blockingItems: blockingItems, 
        updatedAt: serverTimestamp(),
    });

    await recalculateClearanceStatus(userId);
    cacheService.invalidateByPrefix('clearance:');
    fetchClearanceDocuments(orgId).catch(console.error);
}


export const updateClearanceDocumentForAllStudents = async (orgId: string) => {
    const clearanceRef = collection(db, 'clearanceStatus');
    const q = query(
        clearanceRef, 
        where('orgId', '==', orgId), 
        where('isArchived', '==', false)
    );
    const snapshot = await getDocs(q);
    snapshot.docs.forEach(doc => {
        console.log(doc.id);
        updateClearanceDocument(doc.id, orgId);
    });
}

export const addStudentWithClearance = async (studentId: string,studentData: any, orgId: string) => {
    try {
        const batch = writeBatch(db);
        // 1. Generate references
        // If you auto-generate IDs: const studentRef = doc(collection(db, 'users'));
        // If you use an auth UID: const studentRef = doc(db, 'users', studentAuthId);
        const studentRef = doc(db, 'users', studentId); 
        const clearanceRef = doc(db, 'clearanceStatus', studentRef.id);

        const now = Timestamp.now();
        const defaultDueDate = Timestamp.fromDate(new Date('2026-05-30'));

        // 2. Prepare Clearance Data
        const clearanceData: ClearanceStatus = {
            id: studentRef.id,
            orgId: orgId,
            userId: studentRef.id,
            userName: `${studentData.firstName} ${studentData.lastName}`,
            studentId: studentData.studentId,
            academicYear: '2025-2026',
            semester: '2nd',
            status: 'not_cleared',
            visibility: 'public',
            blockingItems: {},
            clearanceDate: null,
            lastCalculatedAt: now,
            startDate: now,
            dueDate: defaultDueDate,
            createdAt: now,
            updatedAt: now,
            isArchived: false
        };

        // 3. Set both documents in the batch
      batch.set(studentRef, { ...studentData, createdAt: now, isDeleted:false }); // Create the user
        batch.set(clearanceRef, clearanceData); // Create their clearance profile

        // 4. Commit to Firestore
        await batch.commit();
        console.log(`✅ Successfully added student ${studentData.firstName} and initialized clearance.`);
        
        cacheService.invalidate(CACHE_KEYS.clearanceDoc(studentRef.id));
        cacheService.invalidate(CACHE_KEYS.clearanceAll(orgId));
        fetchClearanceDocuments(orgId).catch(console.error);

        return studentRef.id;
    } catch (error) {
        console.error("❌ Error adding student and clearance:", error);
        throw error;
    }
};

export const updateClearanceDocumentForPaginatedStudents = async (orgId: string, userIds: string[]) => {
    const clearanceRef = collection(db, 'clearanceStatus');
    const q = query(
        clearanceRef, 
        where('userId', 'in', userIds), 
        where('orgId', '==', orgId), 
        where('isArchived', '==', false)
    );
    const snapshot = await getDocs(q);
    snapshot.docs.forEach(doc => {
        updateClearanceDocument(doc.id, orgId);
    });
}

export const approvePaymentClearanceUpdate = async (
  clearanceId: string, 
  itemsToUpdate: { refId: string, type: PaymentType | string }[], 
  adminId: string,
  adminName: string,
  studentData?: { firstName: string; lastName: string; studentId: string; orgId: string },
  receiptCode?: string
) => {
  const { _approvePayment} = usePaymentApproval();

  const proof = await getProofOfPaymentByUserId(clearanceId, studentData?.orgId);
  if(!proof) {
    toast.error("No pending payment found for this clearance. Please refresh and try again.");
    return;
  }
  const result = await _approvePayment(proof);
  toast.success("Payment clearance update approved successfully!");
  return result;
//   console.log("Approving payment clearance update for items:------------", itemsToUpdate);
//   toast.success("Approving payment clearance update. This may take a moment...")
//   for (const item of itemsToUpdate) {
//     if (item.type === PaymentType.FEES) {
//       const logsRef = collection(db, "fees", item.refId, "paymentHistory");
//       const q = query(logsRef, where("status", "==", "pending"));
//       const snapshot = await getDocs(q);
      
//       if (snapshot.empty) continue; // Skip if no pending found
      
//       const logId = snapshot.docs[0].id;
//       const logData = snapshot.docs[0].data();

//       const proof: ProofOfPayment = {
//         referenceId: item.refId,
//         paymentType: "fees",
//         amount: logData.amount,
//         status: PaymentStatus.VERIFIED,
//         verifiedBy: adminId,
//         verifiedByName: adminName,
//         paymentMethod: logData.paymentMethod,
//         verifiedAt: Timestamp.now(),
//         notes: "Verified via Clearance Management",
//         orgId: studentData?.orgId || "",
//         userName: `${studentData?.firstName} ${studentData?.lastName}` || "",
//         studentId: studentData?.studentId || "",
//         senderNumber: logData.senderNumber || "",
//         referenceNumber: logData.gcashReference || "",
//         imageUrl: logData.imageUrl || "",
//         submittedAt: logData.createdAt?.toDate().toISOString() || new Date().toISOString(),
//         metadata: {
//          items:[]
//         },
//         receiptCode: receiptCode || "",
//       };
// // ---------------------------------to fix toms------------
//       // await verifyPaymentHistory(logId, proof);
//     } else {
//       const logsRef = collection(db, "fines", item.refId, "paymentHistory");
//       const q = query(logsRef, where("status", "==", "pending"));
//       const snapshot = await getDocs(q);
      
//       if (snapshot.empty) continue; // Skip if no pending found
      
//       const logId = snapshot.docs[0].id;
//       const logData = snapshot.docs[0].data();
      
//       const proof: ProofOfPayment = {
//         referenceId: item.refId,
//         paymentType: "fines",
//         amount: logData.amount,
//         status: PaymentStatus.VERIFIED,
//         verifiedBy: adminId,
//         verifiedByName: adminName,
//         paymentMethod: logData.paymentMethod,
//         verifiedAt: Timestamp.now(),
//         notes: "Verified via Clearance Management",
//         orgId: studentData?.orgId || "",
//         userName: `${studentData?.firstName} ${studentData?.lastName}` || "",
//         studentId: studentData?.studentId || "",
//         senderNumber: logData.senderNumber || "",
//         referenceNumber: logData.gcashReference || "",
//         imageUrl: logData.imageUrl || "",
//         submittedAt: logData.createdAt?.toDate().toISOString() || new Date().toISOString(),
//         metadata: {
//          items:[]
//         },
//         receiptCode: receiptCode || "",
//       };
//       // ---------------------------------to fix toms------------
//       // await verifyPaymentHistory(logId, proof);
//     }
//   }
};

export const rejectPaymentClearanceUpdate = async (
 clearanceId: string, 
   itemsToUpdate: { refId: string, type: PaymentType | string }[], 
   adminId: string,
   adminName: string,
   reason: string,
   studentData?: { firstName: string; lastName: string; studentId: string; orgId: string }
) => {

  const { _rejectPayment} = usePaymentApproval();

  const proof = await getProofOfPaymentByUserId(clearanceId, studentData?.orgId);
  if(!proof) {
    toast.error("No pending payment found for this clearance. Please refresh and try again.");
    return;
  }
  const result = await _rejectPayment(proof, reason);
  toast.success("Payment was successfully rejected!");
  return result;

  // for (const item of itemsToUpdate) {
  //   if (item.type === PaymentType.FEES) {
  //    const logsRef = collection(db, "fees", item.refId, "paymentHistory");
  //    const q = query(logsRef, where("status", "==", "pending"));
  //    const snapshot = await getDocs(q);
     
  //    if (snapshot.empty) continue;
     
  //    const logId = snapshot.docs[0].id;
  //    const logData = snapshot.docs[0].data();

  //    const proof: ProofOfPayment = {
  //      referenceId: item.refId,
  //      paymentType: "fees",
  //      amount: logData.amount,
  //      status: PaymentStatus.REJECTED,
  //      verifiedBy: adminId,
  //      verifiedByName: adminName,
  //      paymentMethod: logData.paymentMethod,
  //      verifiedAt: Timestamp.now(),
  //      rejectionReason: reason,
  //      notes: "Rejected via Clearance Management",
  //      orgId: studentData?.orgId || "",
  //      userName: `${studentData?.firstName} ${studentData?.lastName}` || "",
  //      studentId: studentData?.studentId || "",
  //      senderNumber: logData.senderNumber || "",
  //      referenceNumber: logData.gcashReference || "",
  //      imageUrl: logData.imageUrl || "",
  //      submittedAt: logData.createdAt?.toDate().toISOString() || new Date().toISOString(),
  //      metadata: {
  //        items:[]
  //      }
  //    };

  //     // ---------------------------------to fix toms------------
  //   //  await rejectPaymentHistory(logId, proof);
  //  } else {
  //    const logsRef = collection(db, "fines", item.refId, "paymentHistory");
  //    const q = query(logsRef, where("status", "==", "pending"));
  //    const snapshot = await getDocs(q);
     
  //    if (snapshot.empty) continue;
     
  //    const logId = snapshot.docs[0].id;
  //    const logData = snapshot.docs[0].data();
     
  //    const proof: ProofOfPayment = {
  //      referenceId: item.refId,
  //      paymentType: "fines",
  //      amount: logData.amount,
  //      status: PaymentStatus.REJECTED,
  //      verifiedBy: adminId,
  //      verifiedByName: adminName,
  //      paymentMethod: logData.paymentMethod,
  //      verifiedAt: Timestamp.now(),
  //      rejectionReason: reason,
  //      notes: "Rejected via Clearance Management",
  //      orgId: studentData?.orgId || "",
  //      userName: `${studentData?.firstName} ${studentData?.lastName}` || "",
  //      studentId: studentData?.studentId || "",
  //      senderNumber: logData.senderNumber || "",
  //      referenceNumber: logData.gcashReference || "",
  //      imageUrl: logData.imageUrl || "",
  //      submittedAt: logData.createdAt?.toDate().toISOString() || new Date().toISOString(),
  //      metadata: {
  //        items: []
  //      }
  //    };
  //    // ---------------------------------to fix toms------------
  //   //  await rejectPaymentHistory(logId, proof);
  //  }
  // }
 };

 
 export const logManualPaymentClearanceUpdate = async (
   clearanceId: string,
   studentId: string,
   items: { refId: string; title: string; amount: number; paymentType: PaymentType, parentFineId?: string }[],
   method: PaymentMethod,
   adminId: string,
   adminName: string,
   overallPaymentType?: string | PaymentType,
  receiptCode?: string,
 ) => {
  if(!overallPaymentType) {
    throw new Error("Overall payment type is required");
  }
  let totalAmount = 0;
  items.forEach((item) => totalAmount += item.amount);
  // Handle Bulk Payment separately - it should only be called ONCE
  console.log(items);
    return await recordBulkManualPaymentAndUpdateClearance(
      studentId,
      items,
      totalAmount,
      method as any,
      adminId,
      adminName,
      overallPaymentType as PaymentType,
      undefined,
      receiptCode
    );
  
  // else if(overallPaymentType === PaymentType.FINES) {
  //   return await recordBulkManualPaymentAndUpdateClearance(
  //     studentId,
  //     items,
  //     totalAmount,
  //     method as any,
  //     adminId,
  //     adminName,
  //     overallPaymentType as PaymentType
  //   );
  // }

  // // Otherwise handle individual payments
  // const results = await Promise.all(items.map(async (item) => {
  //   if (item.paymentType === PaymentType.FEES) {
  //     return await recordManualPaymentAndUpdateClearance(
  //       item.refId,
  //       item.amount.toString(),
  //       method as any,
  //       adminId,
  //       studentId,
  //       adminName,
  //     );
  //   } else if (item.paymentType === PaymentType.FINES) {
  //     const fines = await getFineById(item.refId) as unknown as StudentFines;
  //     return await addOfflineFinesPayment(fines, PaymentType.FINES, method as any, "", "");
  //   }
  // }));

  // return results;
 };
 

export const seedClearanceDocuments = async (orgId: string) => {
  try {
    // IMPROVEMENT 1: Only fetch students to save read costs and skip manual filtering
    const usersRef = collection(db, 'users');
    const studentQuery = query(usersRef, where('role', '==', 'user'));
    const usersSnapshot = await getDocs(studentQuery);

    if (usersSnapshot.empty) {
      console.log("No students found to seed.");
      return;
    }

    // IMPROVEMENT 2: Fetch existing clearances to safely skip students who already have one
    const existingClearancesSnap = await getDocs(collection(db, 'clearanceStatus'));
    const existingClearanceIds = new Set(existingClearancesSnap.docs.map(doc => doc.id));

    let batch = writeBatch(db);
    let batchOperationCount = 0;
    let totalAddedCount = 0;

    const currentYear = '2025-2026';
    const currentSemester = '2nd';
    
    // IMPROVEMENT 3: Use Timestamp.now() instead of serverTimestamp() to strictly match your TypeScript interface
    const now = Timestamp.now(); 
    const defaultDueDate = Timestamp.fromDate(new Date('2026-05-30'));

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      // Skip if this student already has a clearance document
      if (existingClearanceIds.has(userId)) {
        continue;
      }

      const userData = userDoc.data();
      const clearanceRef = doc(db, 'clearanceStatus', userId);

      const clearanceData: ClearanceStatus = {
        id: userId,
        orgId: orgId, 
        userId: userId,
        userName: `${userData.firstName} ${userData.lastName}`,
        studentId: userData.studentId || "N/A", // Fallback just in case
        academicYear: currentYear,
        semester: currentSemester,
        status: 'cleared', 
        visibility: 'public', 
        blockingItems: {}, 
        clearanceDate: null,
        lastCalculatedAt: now,
        startDate: now,
        dueDate: defaultDueDate,
        createdAt: now,
        updatedAt: now,
        isArchived: false
      };

      // No need for { merge: true } because we already verified they don't exist
      batch.set(clearanceRef, clearanceData); 
      batchOperationCount++;
      totalAddedCount++;

      // Commit the batch if we hit the 400 operation limit
      if (batchOperationCount === 400) {
        await batch.commit();
        batch = writeBatch(db); // Create a fresh batch
        batchOperationCount = 0; // Reset operation counter
      }
    }

    // Commit any remaining operations in the final batch
    if (batchOperationCount > 0) {
      await batch.commit();
    }

    console.log(`✅ Successfully seeded clearance documents for ${totalAddedCount} new students.`);
    cacheService.invalidateByPrefix('clearance:');
    fetchClearanceDocuments(orgId).catch(console.error);
  } catch (error) {
    console.error('❌ Error seeding clearance documents:', error);
  }
};

