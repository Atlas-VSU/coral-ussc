import { collection, doc, getDoc, getDocs, query, serverTimestamp, Timestamp, updateDoc, where, writeBatch } from "firebase/firestore";
import { db } from "./firebase.config";
import { BlockingItem, ClearanceStatus } from "@/features/organization/clearance/types";
import { approvePaymentTransaction, checkFeeStatusForClearance, fetchFee, recordManualPaymentAndUpdateClearance, rejectPaymentTransaction } from "./fees";
import { Fee, FeeWithPaymentHistory, PaymentMethod } from "@/features/organization/fees/types";
import { getFineById, getFineByStudentId } from "./fines/read/fines";
import { ProofOfPayment, StudentFines } from "@/features/organization/fines/types";
import { PaymentType } from "@/constants/types";
import { rejectPaymentHistory, verifyPaymentHistory } from "./payment/update/paymentHistory";
import { PaymentStatus } from "@/constants/status";
import { addOfflineFinesPayment } from "./payment/create/paymentHistory";
export const fetchClearanceDocuments = async (orgId: string) => {
    const clearanceRef = collection(db, 'clearanceStatus');
    const q = query(
        clearanceRef, 
        where('orgId', '==', orgId), 
        where('isArchived', '==', false)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
    })) as ClearanceStatus[];
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
            pendingReview: fee.paymentHistory.some(payment => payment.status === "pending_verification"),
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
            pendingReview: fine.status === "pending" || fine.status === "pending_verification",
            isRequiredForClearance: true, // Fines are usually required for clearance
        };
    }

    const clearanceRef = doc(db, 'clearanceStatus', userId);
    await updateDoc(clearanceRef, {
        blockingItems: blockingItems, 
        updatedAt: serverTimestamp(),
    });

    await recalculateClearanceStatus(userId);
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
        batch.set(studentRef, studentData); // Create the user
        batch.set(clearanceRef, clearanceData); // Create their clearance profile

        // 4. Commit to Firestore
        await batch.commit();
        console.log(`✅ Successfully added student ${studentData.firstName} and initialized clearance.`);
        
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
  refId: string, 
  adminId: string,
  adminName: string,
  itemType: PaymentType,
  studentData?: { firstName: string; lastName: string; studentId: string; orgId: string }
) => {
  if (itemType === PaymentType.FEES) {
    const logsRef = collection(db, "fees", refId, "paymentHistory");
    const q = query(logsRef, where("status", "==", "pending_verification"));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) throw new Error("No pending payment found for this fee");
    
    const logId = snapshot.docs[0].id;
    const logData = snapshot.docs[0].data();

    const proof: ProofOfPayment = {
      referenceId: refId,
      paymentType: "fees",
      amount: logData.amount,
      status: PaymentStatus.VERIFIED,
      verifiedBy: adminId,
      verifiedByName: adminName,
      paymentMethod: logData.paymentMethod,
      verifiedAt: Timestamp.now(),
      notes: "Verified via Clearance Management",
      orgId: studentData?.orgId || "",
      userName: `${studentData?.firstName} ${studentData?.lastName}` || "",
      studentId: studentData?.studentId || "",
      senderNumber: logData.senderNumber || "",
      referenceNumber: logData.gcashReference || "",
      imageUrl: logData.imageUrl || "",
      submittedAt: logData.createdAt?.toDate().toISOString() || new Date().toISOString(),
    };

    return await verifyPaymentHistory(logId, proof);
  } else {
    const logsRef = collection(db, "fines", refId, "paymentHistory");
    const q = query(logsRef, where("status", "==", "pending_verification"));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) throw new Error("No pending payment found for this fine");
    
    const logId = snapshot.docs[0].id;
    const logData = snapshot.docs[0].data();
    
    const proof: ProofOfPayment = {
      referenceId: refId,
      paymentType: "fines",
      amount: logData.amount,
      status: PaymentStatus.VERIFIED,
      verifiedBy: adminId,
      verifiedByName: adminName,
      paymentMethod: logData.paymentMethod,
      verifiedAt: Timestamp.now(),
      notes: "Verified via Clearance Management",
      orgId: studentData?.orgId || "",
      userName: `${studentData?.firstName} ${studentData?.lastName}` || "",
      studentId: studentData?.studentId || "",
      senderNumber: logData.senderNumber || "",
      referenceNumber: logData.gcashReference || "",
      imageUrl: logData.imageUrl || "",
      submittedAt: logData.createdAt?.toDate().toISOString() || new Date().toISOString(),
    };
    
    return await verifyPaymentHistory(logId, proof);
  }
};

export const rejectPaymentClearanceUpdate = async (
 clearanceId: string, 
   refId: string, 
   adminId: string,
   adminName: string,
   reason: string,
   itemType: PaymentType,
   studentData?: { firstName: string; lastName: string; studentId: string; orgId: string }
 ) => {
   if (itemType === PaymentType.FEES) {
     const logsRef = collection(db, "fees", refId, "paymentHistory");
     const q = query(logsRef, where("status", "==", "pending_verification"));
     const snapshot = await getDocs(q);
     
     if (snapshot.empty) throw new Error("No pending payment found for this fee");
     
     const logId = snapshot.docs[0].id;
     const logData = snapshot.docs[0].data();

     const proof: ProofOfPayment = {
       referenceId: refId,
       paymentType: "fees",
       amount: logData.amount,
       status: PaymentStatus.REJECTED,
       verifiedBy: adminId,
       verifiedByName: adminName,
       paymentMethod: logData.paymentMethod,
       verifiedAt: Timestamp.now(),
       rejectionReason: reason,
       notes: "Rejected via Clearance Management",
       orgId: studentData?.orgId || "",
       userName: `${studentData?.firstName} ${studentData?.lastName}` || "",
       studentId: studentData?.studentId || "",
       senderNumber: logData.senderNumber || "",
       referenceNumber: logData.gcashReference || "",
       imageUrl: logData.imageUrl || "",
       submittedAt: logData.createdAt?.toDate().toISOString() || new Date().toISOString(),
     };

     return await rejectPaymentHistory(logId, proof);
   } else {
     const logsRef = collection(db, "fines", refId, "paymentHistory");
     const q = query(logsRef, where("status", "==", "pending_verification"));
     const snapshot = await getDocs(q);
     
     if (snapshot.empty) throw new Error("No pending payment found for this fine");
     
     const logId = snapshot.docs[0].id;
     const logData = snapshot.docs[0].data();
     
     const proof: ProofOfPayment = {
       referenceId: refId,
       paymentType: "fines",
       amount: logData.amount,
       status: PaymentStatus.REJECTED,
       verifiedBy: adminId,
       verifiedByName: adminName,
       paymentMethod: logData.paymentMethod,
       verifiedAt: Timestamp.now(),
       rejectionReason: reason,
       notes: "Rejected via Clearance Management",
       orgId: studentData?.orgId || "",
       userName: `${studentData?.firstName} ${studentData?.lastName}` || "",
       studentId: studentData?.studentId || "",
       senderNumber: logData.senderNumber || "",
       referenceNumber: logData.gcashReference || "",
       imageUrl: logData.imageUrl || "",
       submittedAt: logData.createdAt?.toDate().toISOString() || new Date().toISOString(),
     };
     
     return await rejectPaymentHistory(logId, proof);
   }
 };

 
 export const logManualPaymentClearanceUpdate = async (
   clearanceId: string,
   studentId: string,
   items: { refId: string; amount: number; paymentType: PaymentType }[],
   method: PaymentMethod,
   adminId: string,
   adminName: string,
 ) => {
  const results = await Promise.all(items.map(async (item) => {
    if(item.paymentType == PaymentType.FEES) {
      return await recordManualPaymentAndUpdateClearance(
        item.refId,
        item.amount.toString(),
        method as any,
        adminId,
        studentId,
        adminName
      );
    } else if(item.paymentType == PaymentType.FINES) {
      const fines = await getFineById(item.refId) as unknown as StudentFines;
      return await addOfflineFinesPayment(fines, PaymentType.FINES, method as any, "", "");
    }
   }));

   return results;
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
  } catch (error) {
    console.error('❌ Error seeding clearance documents:', error);
  }
};