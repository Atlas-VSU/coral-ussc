import { collection, doc, getDocs, query, serverTimestamp, Timestamp, updateDoc, where, writeBatch } from "firebase/firestore";
import { db } from "./firebase.config";
import { BlockingItem, ClearanceStatus } from "@/features/organization/clearance/types";
import { checkFeeStatusForClearance } from "./fees";
import { Fee, FeeWithPaymentHistory } from "@/features/organization/fees/types";

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

export const updateClearanceDocument = async (userId: string, orgId: string) => {
    let blockingItems: Record<string, BlockingItem> = {};
    
    const fees = await checkFeeStatusForClearance(userId, orgId) as FeeWithPaymentHistory[];
    
    fees.forEach((fee: FeeWithPaymentHistory) => {
        blockingItems[fee.id] = {
            type: fee.feeType as "membership_fee" | "fee" | "fine",
            referenceId: fee.id,
            title: fee.title,
            balance: fee.balance,
            status: fee.status as "unpaid" | "paid",
            paymentHistory: fee.paymentHistory,
            pendingReview: fee.paymentHistory.some(payment => payment.status === "pending_verification"),
            isRequiredForClearance: fee.isRequiredForClearance,
        };
    });

    // TODO: logic here for fines generating blocking items

    const now = serverTimestamp();
    const isCleared = Object.values(blockingItems).some(item => item.isRequiredForClearance && item.balance > 0);

    const clearanceData = {
        status: isCleared ? "cleared" : "pending",
        blockingItems: blockingItems, 
        clearanceDate: isCleared ? now : null, 
        lastCalculatedAt: now,
        updatedAt: now,
    };

    const clearanceRef = doc(db, 'clearanceStatus', userId);
    await updateDoc(clearanceRef, clearanceData);
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

// Use for generating clearance documents for existing members
export const seedClearanceDocuments = async (orgId: string) => {
  try {
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    if (usersSnapshot.empty) {
      return;
    }

    let batch = writeBatch(db);
    let count = 0;

    const currentYear = '2025-2026';
    const currentSemester = '2nd Semester';
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;

      if(userData.role == "admin") {
        continue
      }

      const clearanceRef = doc(db, 'clearanceStatus', userId);

      const now = serverTimestamp();
      const defaultDueDate = Timestamp.fromDate(new Date('2026-05-30'));

      const clearanceData = {
        id: userId,
        orgId: orgId, 
        userId: userId,
        userName: userData.firstName + " " + userData.lastName,
        studentId: userData.studentId,
        academicYear: currentYear,
        semester: currentSemester,
        status: 'pending', 
        visibility: 'private', 
        blockingItems: {}, 
        clearanceDate: null,
        lastCalculatedAt: now,
        startDate: now,
        dueDate: defaultDueDate,
        createdAt: now,
        updatedAt: now,
        isArchived: false
      } as ClearanceStatus;

      batch.set(clearanceRef, clearanceData, { merge: true });
      count++;

      if (count % 400 === 0) {
        await batch.commit();
        batch = writeBatch(db);
      }
    }

    if (count % 400 !== 0) {
      await batch.commit();
    }

    console.log(`✅ Successfully seeded clearance documents for ${count} students.`);
  } catch (error) {
    console.error('❌ Error seeding clearance documents:', error);
  }
};