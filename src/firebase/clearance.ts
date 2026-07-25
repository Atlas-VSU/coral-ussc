import { collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, Timestamp, updateDoc, where, writeBatch, limit, startAfter, getCountFromServer, queryEqual, QueryConstraint, DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "./firebase.config";
import { BlockingItem, ClearanceStatus } from "@/features/organization/clearance/types";
import { approvePaymentTransaction, checkFeeStatusForClearance, fetchFee, recordBulkManualPaymentAndUpdateClearance, recordManualPaymentAndUpdateClearance, rejectPaymentTransaction } from "./fees";
import { Fee, FeeWithPaymentHistory, PaymentMethod } from "@/features/organization/fees/types";
import { getFineByStudentId } from "./fines/read/fines";
import { PaymentType, Term } from "@/constants/types";
import { toast } from "sonner";
import { getProofOfPaymentByUserId } from "./payment/read/proofOfPayment";
import { cacheService, CACHE_KEYS, CACHE_DURATIONS } from "@/services/cacheService";
import { usePaymentApproval } from "@/features/organization/payments/hooks/usePaymentApproval";
import { updateStudentStats } from "./stats/update/updateStats";
import { getActiveTerm } from "./term";
import { getCurrentUserData } from "./users";
import { Member } from "@/features/organization/members/types";
import { UserData } from "@/hooks/useAuth";
import { getOrgById } from "./organization";

/**
 * Builds a stable, per-term clearance document ID.
 * Format: `<userId>[<orgId>]:<AY>-<semester>`
 * Including the term ensures each semester has its own clearance document
 * instead of overwriting the previous one.
 */
export const buildClearanceId = (
  userId: string,
  orgId: string | undefined | null,
  accessLevel: number,
  term: { AY: string; semester: string }
): string => {
  const termSuffix = `:${term.AY}-${term.semester}`.replace(/\s/g, '_');
  if (orgId) {
    return `${userId}${orgId}${termSuffix}`;
  }
  return `${userId}${termSuffix}`;
};

export const getClearanceStats = async (
  orgId: string,
  statusFilter: string = "all",
  selectedTerm?: { AY: string; semester: string } | null
) => {
  const term = selectedTerm || await getActiveTerm();
  return cacheService.getOrFetch(
    `clearance:stats:${orgId}:${statusFilter}:${term?.AY}-${term?.semester}`,
    async () => {
      const snapshot = await getCountFromServer(query(
        collection(db, 'clearanceStatus'),
        where('orgId', '==', orgId),
        where('isArchived', '==', false),
        where('status', '==', statusFilter),
        where("academicYear", "==", term!.AY),
        where("semester", "==", term!.semester)
      ));
      return snapshot.data().count;
    },
    CACHE_DURATIONS.COUNTS
  );
}

/**
 * Fetches clearance documents with server-side pagination and searching.
 */
export const fetchClearanceDocumentsPaginated = async (
  orgId: string,
  pageSize: number = 9,
  lastVisibleDoc: any = null,
  searchTerm: string = "",
  statusFilter: string = "all",
  needCount: boolean = false,
  forManualPayment: boolean = false,
  selectedTerm?: { AY: string; semester: string } | null
) => {
  const clearanceRef = collection(db, "clearanceStatus");
  const term = selectedTerm || await getActiveTerm();
  let constraints: QueryConstraint[] = [
    where("orgId", "==", orgId),
    where("isArchived", "==", false),
    where("academicYear", "==", term!.AY),
    where("semester", "==", term!.semester)
  ];

  if (statusFilter !== "all") {
    constraints.push(where("status", "==", statusFilter));
  }

  // Normalize search term
  const isIdSearch = /\d/.test(searchTerm);
  const normalizedSearch = isIdSearch
    ? searchTerm.trim()
    : searchTerm.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

  if (normalizedSearch) {
    const searchField = isIdSearch ? "studentId" : "userName";
    constraints.push(where(searchField, ">=", normalizedSearch));
    constraints.push(where(searchField, "<=", normalizedSearch + "\uf8ff"));
    constraints.push(orderBy(searchField));
  } else if (forManualPayment) {
    constraints.push(orderBy("userName", "asc"));
  }
  else {
    constraints.push(orderBy("updatedAt", "desc"));
  }

  let count = 0;
  if (needCount) {
    const countSnapshot = await getCountFromServer(query(clearanceRef, ...constraints));
    count = countSnapshot.data().count; //This is for total count of searched item
  }

  // Apply pagination
  constraints.push(limit(pageSize));
  if (lastVisibleDoc) {
    constraints.push(startAfter(lastVisibleDoc));
  }

  const q = query(clearanceRef, ...constraints);
  const snapshot = await getDocs(q);

  const docs = snapshot.docs.map((doc) => {
    const data = { id: doc.id, ...doc.data() } as ClearanceStatus;
    const key = CACHE_KEYS.clearanceDoc(doc.id);

    // Check if it already exists to determine if it's a "hit" or "miss" for visibility
    const cached = cacheService.get(key);
    if (cached) {
      // Color-coded logs matching cacheService.ts for a professional feel
      // console.log(
      //   `%c[Cache Hit]%c ${key}`,
      //   "color: #10b981; font-weight: bold;",
      //   "color: inherit;"
      // );
    } else {
      // console.log(
      //   `%c[Cache Miss]%c ${key}`,
      //   "color: #f59e0b; font-weight: bold;",
      //   "color: inherit;"
      // );
      cacheService.set(key, data, CACHE_DURATIONS.CLEARANCE);
    }

    return data;
  });

  return {
    docs,
    lastVisible: snapshot.docs[snapshot.docs.length - 1] || null,
    allSnapshots: snapshot.docs,
    hasMore: snapshot.docs.length === pageSize,
    count: count, // Return total count of searched items for pagination controls
  };
};

/**
 * Gets the total count of clearance documents for an organization with optional search.
 */
export const getClearanceCount = async (
  orgId: string,
  statusFilter: string = "all",
  searchTerm: string = "",
  selectedTerm?: { AY: string; semester: string } | null
) => {
  const term = selectedTerm || await getActiveTerm();
  return cacheService.getOrFetch(
    `clearance:count:${orgId}:${statusFilter}:${searchTerm}:${term?.AY}-${term?.semester}`,
    async () => {
      const clearanceRef = collection(db, "clearanceStatus");
      const constraints: any[] = [
        where("orgId", "==", orgId),
        where("isArchived", "==", false),
        where("academicYear", "==", term!.AY),
        where("semester", "==", term!.semester)
      ];

      if (statusFilter !== "all") {
        constraints.push(where("status", "==", statusFilter));
      }

      const isIdSearch = /\d/.test(searchTerm);
      const normalizedSearch = isIdSearch
        ? searchTerm.trim()
        : searchTerm.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

      if (normalizedSearch) {
        const searchField = isIdSearch ? "studentId" : "userName";
        constraints.push(where(searchField, ">=", normalizedSearch));
        constraints.push(where(searchField, "<=", normalizedSearch + "\uf8ff"));
      }

      const q = query(clearanceRef, ...constraints);
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    },
    CACHE_DURATIONS.COUNTS
  );
};

// Deprecated in favor of fetchClearanceDocumentsPaginated
export const fetchClearanceDocuments = async (orgId: string) => {
  console.warn("fetchClearanceDocuments is deprecated. Use fetchClearanceDocumentsPaginated instead.");
  const { docs } = await fetchClearanceDocumentsPaginated(orgId, 100); // Fetch first 100 as fallback
  return docs;
}

/**
 * Fetches ALL clearance records for a given org and term — intended for export only.
 * WARNING: This is an unbounded read. Do not use for UI lists.
 *
 * @param excludeIdPrefix - Optional student ID prefix to exclude (e.g. "26-" for AY 2025-2026
 *   where 2026-batch students were not yet part of the org). Leave undefined for newer terms.
 */
export const fetchAllClearanceForExport = async (
  orgId: string,
  term: { AY: string; semester: string },
  excludeIdPrefix?: string
): Promise<ClearanceStatus[]> => {
  const q = query(
    collection(db, "clearanceStatus"),
    where("orgId", "==", orgId),
    where("isArchived", "==", false),
    where("academicYear", "==", term.AY),
    where("semester", "==", term.semester),
    orderBy("userName", "asc")
  );

  const snapshot = await getDocs(q);
  const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClearanceStatus));

  if (excludeIdPrefix) {
    return records.filter(c => !c.studentId.startsWith(excludeIdPrefix));
  }
  return records;
};

export const getCountOfUnclearedDocuments = async (
  orgId: string,
  selectedTerm?: { AY: string; semester: string } | null
) => {
  const term = selectedTerm || await getActiveTerm();
  const snapshot = await getCountFromServer(query(
    collection(db, 'clearanceStatus'),
    where('orgId', '==', orgId),
    where('isArchived', '==', false),
    where('status', '==', 'not_cleared'),
    where("academicYear", "==", term!.AY),
    where("semester", "==", term!.semester)
  ));
  return snapshot.data().count;
}


export const fetchClearanceStatus = async (userId: string, term?: { AY: string; semester: string } | null) => {
  const currentUser = await getCurrentUserData() as unknown as Member;
  const activeTerm = term || await getActiveTerm();
  const id = buildClearanceId(userId, currentUser.orgId, currentUser.accessLevel!, activeTerm!);
  return cacheService.getOrFetch(
    CACHE_KEYS.clearanceDoc(id),
    async () => {
      const docRef = doc(db, 'clearanceStatus', id);
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
export const recalculateClearanceStatus = async (userId: string, term?: any) => {
  const currentUser = await getCurrentUserData() as unknown as Member;
  const activeTerm = term || await getActiveTerm();
  const id = buildClearanceId(userId, currentUser.orgId, currentUser.accessLevel!, activeTerm!);
  const clearanceRef = doc(db, 'clearanceStatus', id);
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

  cacheService.invalidate(CACHE_KEYS.clearanceDoc(id));
  // Invalidate aggregate counts/stats so they reflect the new status
  if (clearance.orgId) {
    cacheService.invalidateByPrefix(`clearance:stats:${clearance.orgId}`);
    cacheService.invalidateByPrefix(`clearance:count:${clearance.orgId}`);
  }
}

// export const updateClearanceDocument = async (userId: string, orgId: string) => {
//     let blockingItems: Record<string, BlockingItem> = {};
//     const currentUser = await getCurrentUserData() as unknown as Member;

//     const fees = await checkFeeStatusForClearance(userId, orgId) as FeeWithPaymentHistory[];

//     fees.forEach((fee: FeeWithPaymentHistory) => {
//         blockingItems[fee.id] = {
//             type: fee.feeType as PaymentType,
//             referenceId: fee.id,
//             title: fee.title,
//             balance: fee.balance,
//             status: fee.status as "unpaid" | "paid",
//             paymentHistory: fee.paymentHistory,
//             pendingReview: fee.paymentHistory.some(payment => payment.status === "pending"),
//             isRequiredForClearance: fee.isRequiredForClearance,
//             academicYear: (fee as any).academicYear,
//             semester: (fee as any).semester,
//         };
//     });

//     // logic here for fines generating blocking items
//     const fine = await getFineByStudentId(userId);
//     if (fine && fine.balance > 0) {
//         blockingItems[fine.id!] = {
//             type: PaymentType.FINES,
//             referenceId: fine.id!,
//             title: "Fines",
//             balance: fine.balance,
//             status: fine.status as "unpaid" | "paid",
//             paymentHistory: [],
//             pendingReview: fine.status === "pending",
//             isRequiredForClearance: true,
//             academicYear: fine.academicYear,
//             semester: fine.semester,
//         };
//     }
//     let id = userId;
//     if (currentUser.accessLevel !== 3) {
//       id = userId+currentUser.orgId
//     }
//     const term = await getActiveTerm();
//     const clearanceId = buildClearanceId(userId, currentUser.orgId, currentUser.accessLevel!, term!);
//     const clearanceRef = doc(db, 'clearanceStatus', clearanceId);
//     await updateDoc(clearanceRef, {
//         blockingItems: blockingItems, 
//         updatedAt: serverTimestamp(),
//     });

//     await recalculateClearanceStatus(userId);
//     cacheService.invalidateByPrefix('clearance:doc:');
//     // Count/stats are invalidated inside recalculateClearanceStatus; but invalidate broadly for safety
//     cacheService.invalidateByPrefix(`clearance:stats:`);
//     cacheService.invalidateByPrefix(`clearance:count:`);
// }


export const addStudentWithClearance = async (studentId: string, studentData: any, orgId: string) => {
  try {
    const term = await getActiveTerm();
    const currentUser = await getCurrentUserData() as unknown as Member;
    const batch = writeBatch(db);
    const studentRef = doc(db, 'users', studentId);
    const id = buildClearanceId(studentRef.id, orgId, currentUser.accessLevel!, term!);
    const clearanceRef = doc(db, 'clearanceStatus', id);

    const now = Timestamp.now();
    const defaultDueDate = Timestamp.fromDate(new Date('2026-05-30'));

    // Get all payables for blocking clearance


    // 2. Prepare Clearance Data
    const clearanceData: ClearanceStatus = {
      id: id,
      orgId: orgId,
      userId: studentRef.id,
      userName: `${studentData.firstName} ${studentData.lastName}`,
      studentId: studentData.studentId,
      academicYear: term!.AY,
      semester: term!.semester,
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
    batch.set(clearanceRef, clearanceData); // Create their clearance profile

    // 4. Commit to Firestore
    await batch.commit();
    // console.log(`✅ Successfully added student ${studentData.firstName} and initialized clearance.`);

    cacheService.invalidate(CACHE_KEYS.clearanceDoc(studentRef.id));

    await updateStudentStats(`${term!.AY}-${term!.semester}-${orgId}`, 1);

    return studentRef.id;
  } catch (error) {
    console.error("❌ Error adding student and clearance:", error);
    throw error;
  }
};

export const approvePaymentClearanceUpdate = async (
  userId: string,
  // itemsToUpdate: { refId: string, type: PaymentType | string }[], 
  // adminId: string,
  // adminName: string,
  studentData?: { firstName: string; lastName: string; studentId: string; orgId: string },
  // receiptCode?: string
) => {
  const { _approvePayment } = usePaymentApproval();

  const proof = await getProofOfPaymentByUserId(userId, studentData?.orgId);
  if (!proof) {
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
  userId: string,
  //  itemsToUpdate: { refId: string, type: PaymentType | string }[], 
  //  adminId: string,
  //  adminName: string,
  reason: string,
  studentData?: { firstName: string; lastName: string; studentId: string; orgId: string }
) => {

  const { _rejectPayment } = usePaymentApproval();

  const proof = await getProofOfPaymentByUserId(userId, studentData?.orgId);
  if (!proof) {
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

export const fetchStats = async (
  orgId: string,
  selectedTerm?: { AY: string; semester: string } | null
) => {
  const term = selectedTerm || await getActiveTerm();
  return cacheService.getOrFetch(
    `clearance:stats:${orgId}:${term?.AY}-${term?.semester}`,
    async () => {
      if (!orgId) return;
      const [cleared, not_cleared, pending] = await Promise.all([
        getClearanceStats(orgId, "cleared", term),
        getClearanceStats(orgId, "not_cleared", term),
        getClearanceStats(orgId, "pending", term),
      ])
      const stats = { cleared, not_cleared, pending }
      return stats;
    }
    , CACHE_DURATIONS.COUNTS);
}


export const logManualPaymentClearanceUpdate = async (
  clearanceId: string,
  studentId: string,
  items: { refId: string; title: string; amount: number; paymentType: PaymentType, parentFineId?: string }[],
  method: PaymentMethod,
  adminId: string,
  adminName: string,
  overallPaymentType?: string | PaymentType,
  receiptCode?: string,
  term?: Term
) => {
  if (!overallPaymentType) {
    throw new Error("Overall payment type is required");
  }
  let totalAmount = 0;
  items.forEach((item) => totalAmount += item.amount);
  return await recordBulkManualPaymentAndUpdateClearance(
    studentId,
    items,
    totalAmount,
    method as any,
    adminId,
    adminName,
    overallPaymentType as PaymentType,
    undefined,
    receiptCode,
    term
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


export const seedClearanceDocuments = async (user: UserData, term: Term) => {
  try {
    const accessLevel = user.accessLevel || 3;
    const org = await getOrgById(user.orgId!);

    // IMPROVEMENT 1: Only fetch students to save read costs and skip manual filtering
    const usersRef = collection(db, 'users');
    let studentQuery = query(usersRef, where('role', '==', 'user'), where('isDeleted', '==', false), where("status", "==", "approved"));
    if (accessLevel === 1 && org) {
      studentQuery = query(studentQuery, where("programId", "==", org.programId ?? ""));
    } else if (accessLevel === 2 && org) {
      studentQuery = query(studentQuery, where("facultyId", "==", org.facultyId ?? ""));
    }
    const usersSnapshot = await getDocs(studentQuery);

    if (usersSnapshot.empty) {
      return;
    }

    // IMPROVEMENT 2: Fetch existing clearances to safely skip students who already have one
    const existingClearancesSnap = await getDocs(query(collection(db, 'clearanceStatus'), where("academicYear", "==", term.AY), where("semester", "==", term.semester)));
    const existingClearanceIds = new Set(existingClearancesSnap.docs.map(doc => doc.id));

    let batch = writeBatch(db);
    let batchOperationCount = 0;
    let totalAddedCount = 0;

    // IMPROVEMENT 3: Use Timestamp.now() instead of serverTimestamp() to strictly match your TypeScript interface
    const now = Timestamp.now();
    const defaultDueDate = Timestamp.fromDate(new Date('2026-05-30'));

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const clearanceId = buildClearanceId(userId, user.orgId, accessLevel, term);
      const clearanceRef = doc(db, 'clearanceStatus', clearanceId);

      // Skip if this student already has a clearance document
      if (existingClearanceIds.has(clearanceId)) {
        continue;
      }

      const userData = userDoc.data();

      const clearanceData: ClearanceStatus = {
        id: clearanceId,
        orgId: user.orgId!,
        userId: userId,
        userName: `${userData.firstName} ${userData.lastName}`,
        studentId: userData.studentId || "N/A", // Fallback just in case
        academicYear: term!.AY,
        semester: term!.semester,
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
    cacheService.invalidateByPrefix('clearance:doc:');
  } catch (error) {
    console.error('❌ Error seeding clearance documents:', error);
  }
};

