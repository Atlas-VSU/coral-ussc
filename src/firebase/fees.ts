import { Member, MemberData } from "@/features/organization/members/types";
import { collection, deleteField, doc, getCountFromServer, getDoc, getDocs, increment, limit, orderBy, query, runTransaction, setDoc, startAfter, Timestamp, updateDoc, where, writeBatch } from "firebase/firestore";
import { db } from "./firebase.config";
import { FeeGenerationSchema } from "@/features/organization/fees/utils/feeGenerationSchema";
import z from "zod";
import { Fee, FeeWithPaymentHistory, PaymentLog } from "@/features/organization/fees/types";
import { getAllMembersOfAnOrg} from "./members";
import { getCurrentUserCount, getCurrentUserData } from "./users";
import { PaymentStatus } from "@/constants/status";
import { PaymentType, Term } from "@/constants/types";
import { buildClearanceId, recalculateClearanceStatus } from "./clearance";
import { recalculateFines } from "./fines/update/recalculate";
import { cacheService, CACHE_KEYS, CACHE_DURATIONS } from "@/services/cacheService";
import { FeeItem } from "@/app/(public)/payment/page";
import { updateFeeStats, updateFineStats } from "./stats/update/updateStats";
import { getActiveTerm } from "./term";


export const checkFeeTitleExist = async (title: string, academicYear: string, semester: string) => {
    const currentUser = await getCurrentUserData() as unknown as Member;
    const feeRef = collection(db, "fees");
    const q = query(
        feeRef, 
        where("title", "==", title), 
        where("academicYear", "==", academicYear), 
        where("semester", "==", semester), 
        where("orgId", "==", currentUser.orgId), 
        where("isArchived", "==", false)
    );
    
    const feeSnapshot = await getCountFromServer(q);
    return feeSnapshot.data().count > 0;
}

export const checkFeeStatusForClearance = async (userId: string, orgId: string) => {
    // Hoist term so it can be embedded in the cache key.
    // getActiveTerm() is itself cached (5 min TTL), so this adds no extra DB read.
    const term = await getActiveTerm();
    return cacheService.getOrFetch(
        `${CACHE_KEYS.feeStatusForClearance(userId, orgId)}:${term?.AY}-${term?.semester}`,
        async () => {
            const feeRef = collection(db, "fees");
            const q = query(
                feeRef, 
                where("userId", "==", userId), 
                where("orgId", "==", orgId), 
                where("isArchived", "==", false),
                where("academicYear", "==", term?.AY || ""), 
                where("semester", "==", term?.semester || ""),
                limit(10)
            );
            
            const feeSnapshot = await getDocs(q);

            const feesWithHistory = await Promise.all(feeSnapshot.docs.map(async (feeDoc) => {
                const feeData = feeDoc.data();
                
                const paymentHistoryRef = collection(db, "fees", feeDoc.id, "paymentHistory");
                
                const paymentHistorySnapshot = await getDocs(paymentHistoryRef);
                const paymentHistory = paymentHistorySnapshot.docs.map(paymentDoc => ({
                    id: paymentDoc.id,
                    ...paymentDoc.data()
                }));

                return {
                    id: feeDoc.id,
                    ...feeData,
                    paymentHistory: paymentHistory
                } as FeeWithPaymentHistory;
            }));

            return feesWithHistory;
        },
        CACHE_DURATIONS.FEES
    );
}

export const getTotalCollectedAmount = async (
  orgId: string,
  selectedTerm?: { AY: string; semester: string } | null
) => {
    const term = selectedTerm || await getActiveTerm();
    return cacheService.getOrFetch(
        `fees:totalCollectedAmount:${orgId}:${term?.AY}-${term?.semester}`,
        async () => {
            const feeRef = collection(db, "feeItems");
            const q = query(
                feeRef, 
                where("orgId", "==", orgId),
                where("isArchived", "==", false),
                where("academicYear", "==", term?.AY || ""),
                where("semester", "==", term?.semester || "")
            );
            
            const feeSnapshot = await getDocs(q);
            
            const totalPaid = await feeSnapshot.docs.reduce(async (acc, feeDoc) => {
                const feeData = feeDoc.data();
                return (await acc) + (await getTotalPaidAmountCount(feeData.id) * feeData.amount);
            }, Promise.resolve(0));
            
            return totalPaid;
        },
        CACHE_DURATIONS.FEES
    );
}

export interface GenerationProgress {
    processedCount: number;
    totalCount: number;
    currentBatch: number;
    totalBatches: number;
}

// OPTIMIZED: createFee — fetch student count in parallel with fee doc prep
export const createFee = async (
    feeData: z.infer<typeof FeeGenerationSchema>,
    currentUserData: any,
    selected: Term
) => {
    const feeRef = collection(db, "feeItems");
    const feeDocRef = doc(feeRef);

    // Fetch totalStudents concurrently — no need to await it before prepping the doc
    const [totalStudents] = await Promise.all([
        getCurrentUserCount(),
    ]);

    await setDoc(feeDocRef, {
        ...feeData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        orgId: currentUserData.orgId,
        totalStudents,
        id: feeDocRef.id,
        isArchived: false,
        academicYear: selected.AY,
        semester: selected.semester,
    });

    return feeDocRef.id;
};

// OPTIMIZED: generateFeesForAllStudentsInAnOrg
export const generateFeesForAllStudentsInAnOrg = async (
    feeData: z.infer<typeof FeeGenerationSchema>,
    currentUserData: any,
    onProgress?: (progress: GenerationProgress) => void,
    eventId?: string
): Promise<void> => {
    const term = await getActiveTerm();
    const students = await getAllMembersOfAnOrg(currentUserData) as any;
    const totalCount = students.length;
    if (totalCount === 0) throw new Error("No students provided");

    // Create fee item ONCE — but run student count fetch in parallel
    const feeItem = await createFee(feeData, currentUserData, term!);

    const feesCollection = collection(db, "fees");
    const clearanceCollection = collection(db, "clearanceStatus");
    const now = Timestamp.now();
    // Firestore max 500 writes per batch (each student = 2 writes: fee + clearance)
    // So safe chunk size = 200 students = 400 writes — well within limits
    const CHUNK_SIZE = 200;
    const chunks: MemberData[][] = [];
    for (let i = 0; i < totalCount; i += CHUNK_SIZE) {
        chunks.push(students.slice(i, i + CHUNK_SIZE));
    }

    const totalBatches = chunks.length;
    let processedCount = 0;

    // Process chunks in parallel — run up to CONCURRENCY chunks simultaneously
    // Firestore handles concurrent batches fine; keeps network idle time near zero
    const CONCURRENCY = 5;
    for (let i = 0; i < chunks.length; i += CONCURRENCY) {
        const parallelChunks = chunks.slice(i, i + CONCURRENCY);

        await Promise.all(
            parallelChunks.map(async (chunk, localIdx) => {
                const batch = writeBatch(db);
                const feeDocRefs: { ref: any; studentId: string }[] = [];

                chunk.forEach((student: MemberData) => {
                    const feeDocRef = doc(feesCollection);
                    const studentId = student.id || "";
                    feeDocRefs.push({ ref: feeDocRef, studentId });

                    // Write 1: Fee document
                    batch.set(feeDocRef, {
                        orgId: currentUserData.orgId,
                        userId: studentId,
                        userName: `${student.member.firstName} ${student.member.lastName}`,
                        studentId: student.member.studentId,
                        feeItemId: feeItem,
                        feeType: feeData.feeType,
                        title: feeData.title,
                        amount: feeData.amount,
                        paidAmount: 0,
                        balance: feeData.amount,
                        status: "unpaid",
                        academicYear: term?.AY || "",
                        semester: term?.semester || "",
                        description: feeData.description,
                        eventId: eventId || null,
                        dueDate: feeData.dueDate,
                        isRequiredForClearance: feeData.isRequiredForClearance,
                        createdBy: currentUserData.uid,
                        createdAt: now,
                        updatedAt: now,
                        isArchived: false,
                    });

                    // Write 2: Clearance document
                    if (studentId) {
                        const id = buildClearanceId(studentId, currentUserData.orgId, currentUserData.accessLevel as number, term!);
                        const clearanceDocRef = doc(clearanceCollection, id);
                        batch.set(clearanceDocRef, {
                            id: id,
                            userId: studentId,
                            orgId: currentUserData.orgId,
                            studentId: student.member.studentId || "N/A",
                            userName: `${student.member.firstName} ${student.member.lastName}`,
                            status: "not_cleared",
                            academicYear: term?.AY || "",
                            semester: term?.semester || "",
                            isArchived: false,
                            createdAt: now,
                            blockingItems: {
                                [feeDocRef.id]: {
                                    type: PaymentType.FEES,
                                    referenceId: feeDocRef.id,
                                    title: feeData.title,
                                    balance: feeData.amount,
                                    status: "unpaid",
                                    paymentHistory: [],
                                    pendingReview: false,
                                    isRequiredForClearance: feeData.isRequiredForClearance,
                                    academicYear: term?.AY || "",
                                    semester: term?.semester || ""
                                },
                            },
                            updatedAt: now,
                        }, { merge: true });
                    }
                });

                await batch.commit();

                // KEY OPTIMIZATION: recalculateClearanceStatus in parallel per chunk
                // instead of awaiting each one sequentially
                await Promise.all(
                    chunk
                        .filter((s) => !!s.id)
                        .map((s) => recalculateClearanceStatus(s.id!))
                );
                
                processedCount += chunk.length;
                onProgress?.({
                    processedCount: Math.min(processedCount, totalCount),
                    totalCount,
                    currentBatch: i + localIdx + 1,
                    totalBatches,
                });
            })
        );
    }
    const toAdd = totalCount * feeData.amount;
    await updateFeeStats(`${term!.AY}-${term!.semester}-${currentUserData.orgId}`, toAdd)

    // Cache invalidation
    const orgId = currentUserData.orgId || "";
    cacheService.invalidate(CACHE_KEYS.clearanceAll(orgId));
    cacheService.invalidateByPrefix(`fees:count:${orgId}`);
    cacheService.invalidateByPrefix(`clearance:stats:${orgId}`);
    cacheService.invalidateByPrefix(`clearance:count:${orgId}`);
};


/**
 * Assigns ALL existing (non-archived) fee items of an org to a newly added student.
 * - Creates a `fees` document per fee item for the student
 * - Adds each fee as a blockingItem in the student's `clearanceStatus` doc
 * - Increments `totalStudents` on each feeItem doc
 *
 * Call this right after addStudentWithClearance() when role === "user".
 */
export const assignExistingFeesToStudent = async (
    userId: string,
    studentData: {
        firstName: string;
        lastName: string;
        studentId: string;
    },
    orgContext: { uid: string, accessLevel: number },
    currentUser: Member
): Promise<void> => {
    const orgId = orgContext.uid;
    const term = await getActiveTerm();

    const feeItemsRef = collection(db, "feeItems");
    const feeItemsQuery = query(
        feeItemsRef,
        where("orgId", "==", orgId),
        where("isArchived", "==", false),
        where("academicYear", "==", term?.AY || ""),
        where("semester", "==", term?.semester || "")
    );
    const feeItemsSnap = await getDocs(feeItemsQuery);
 
    if (feeItemsSnap.empty) return;
    const id = buildClearanceId(userId, orgId, orgContext.accessLevel, term!);
    const feesCollection = collection(db, "fees");
    const clearanceRef = doc(db, "clearanceStatus", id);
    const now = Timestamp.now();
    const userName = `${studentData.firstName} ${studentData.lastName}`;
 
    const CHUNK_SIZE = 100;
    const feeItemDocs = feeItemsSnap.docs;
    let totalAmount = 0;
 
    for (let i = 0; i < feeItemDocs.length; i += CHUNK_SIZE) {
        const chunk = feeItemDocs.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
        const blockingItems: Record<string, object> = {};
 
        chunk.forEach((feeItemDoc) => {
            const feeItem = feeItemDoc.data();
            const feeDocRef = doc(feesCollection);
 
            batch.set(feeDocRef, {
                orgId,
                userId,
                userName,
                studentId: studentData.studentId,
                feeItemId: feeItemDoc.id,
                feeType: feeItem.feeType,
                title: feeItem.title,
                amount: feeItem.amount,
                paidAmount: 0,
                balance: feeItem.amount,
                status: "unpaid",
                academicYear: feeItem.academicYear ?? term?.AY,
                semester: feeItem.semester ?? term?.semester,
                description: feeItem.description ?? "",
                eventId: feeItem.eventId ?? null,
                dueDate: feeItem.dueDate ?? null,
                isRequiredForClearance: feeItem.isRequiredForClearance,
                createdBy: orgId,
                createdAt: now,
                updatedAt: now,
                isArchived: false,
            });
 
            batch.update(feeItemDoc.ref, {
                totalStudents: increment(1),
                updatedAt: now,
            });
 
            if (feeItem.isRequiredForClearance) {
                blockingItems[feeDocRef.id] = {
                    type: PaymentType.FEES,
                    referenceId: feeDocRef.id,
                    title: feeItem.title,
                    balance: feeItem.amount,
                    status: "unpaid",
                    paymentHistory: [],
                    pendingReview: false,
                    isRequiredForClearance: feeItem.isRequiredForClearance,
                    academicYear: feeItem.academicYear ?? term?.AY,
                    semester: feeItem.semester ?? term?.semester,
                };
            }
            totalAmount += feeItem.amount;
        });
 
        if (Object.keys(blockingItems).length > 0) {
            batch.set(
                clearanceRef,
                { blockingItems, updatedAt: now },
                { merge: true }
            );
        }
 
        await batch.commit();
    }
    await updateFeeStats(`${term!.AY}-${term!.semester}-${orgId}`,totalAmount, 0);
    await recalculateClearanceStatus(userId);
};

export const fetchFeeItem = async(orgId: string, feeItemId: string): Promise<FeeItem | null> => {
    const feesRef = collection(db, "feeItems");
    const q = query(
        feesRef,
        where("orgId", "==", orgId),
        where("id", "==", feeItemId),
        where("isArchived", "==", false),
        limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as unknown as FeeItem;
}

export const fetchFeesForOrg = async(
  orgId: string,
  selectedTerm?: { AY: string; semester: string } | null
): Promise<FeeItem[]> => {
    const term = selectedTerm || await getActiveTerm();
    return cacheService.getOrFetch(
        `fees:org:${orgId}:${term?.AY}-${term?.semester}`,
        async () => {
            const feesRef = collection(db, "feeItems");
            const q = query(
                feesRef,
                where("orgId", "==", orgId),
                where("isArchived", "==", false),
                where("academicYear", "==", term?.AY || ""),
                where("semester", "==", term?.semester || ""),
                orderBy("createdAt", "desc")
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as unknown as FeeItem[];
        },
        CACHE_DURATIONS.FEES
    );
}

export const getTotalPaidAmountCount = async(feeItemId: string): Promise<number> => {
    return cacheService.getOrFetch(
        CACHE_KEYS.totalPaidAmountCount(feeItemId),
        async () => {
        const feesRef = collection(db, "fees");
        const q = query(
            feesRef,
            where("feeItemId", "==", feeItemId),
            where("status", "in", ["verified", "paid"]),
            
        );
        const snapshot = await getCountFromServer(q);
        return snapshot.data().count;
    }, 
    CACHE_DURATIONS.FEES
    );
}

export const getTotalRejectedAmountCount = async(feeItemId: string): Promise<number> => {
    return cacheService.getOrFetch(
        CACHE_KEYS.totalRejectedAmountCount(feeItemId),
        async () => {
    const feesRef = collection(db, "fees");
    const q = query(
        feesRef,
        where("feeItemId", "==", feeItemId),
        where("status", "==", "rejected")
    );
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
    }, 
    CACHE_DURATIONS.FEES
    );
}

export const getTotalUnpaidAmountCount = async(feeItemId: string): Promise<number> => {
    return cacheService.getOrFetch(
        CACHE_KEYS.totalUnpaidAmountCount(feeItemId),
        async () => {
    const feesRef = collection(db, "fees");
    const q = query(
        feesRef,
        where("feeItemId", "==", feeItemId),
        where("status", "in", ["unpaid", "partial"])
    );
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
    }, 
    CACHE_DURATIONS.FEES
    );
}

export const getTotalPendingAmountCount = async(feeItemId: string): Promise<number> => {
    return cacheService.getOrFetch(
        CACHE_KEYS.totalPendingAmountCount(feeItemId),
        async () => {
    const feesRef = collection(db, "fees");
    const q = query(
        feesRef,
        where("feeItemId", "==", feeItemId),
        where("status", "==", "pending")
    );
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
    }, 
    CACHE_DURATIONS.FEES
    );
}


// export const fetchUnpaidFeesForOrg = async (): Promise<Fee[]> => {
//     const currentUser = await getCurrentUserData() as unknown as Member;
//     return cacheService.getOrFetch(
//         CACHE_KEYS.feesUnpaid(currentUser.id || ''),
//         async () => {
//             const feesRef = collection(db, "fees");
//             const q = query(
//                 feesRef,
//                 where("orgId", "==", currentUser.id),
//                 where("isArchived", "==", false),
//                 where("status", "in", ["unpaid", "partial"]),
//                 orderBy("createdAt", "desc")
//             );
//             const snapshot = await getDocs(q);
//             return snapshot.docs.map(doc => ({
//                 id: doc.id,
//                 ...doc.data()
//             })) as unknown as Fee[];
//         },
//         CACHE_DURATIONS.PAYMENTS
//     );
// }


/**
 * Fetches fee documents with server-side pagination and searching.
 */
export const fetchFeesPaginated = async (
  orgId: string,
  feeItemId: string,
  pageSize: number = 9,
  lastVisibleDoc: any = null,
  searchTerm: string = "",
  statusFilter: string = "all"
) => {
  let constraints: any[] = [
    where("orgId", "==", orgId),
    where("feeItemId", "==", feeItemId),
    where("isArchived", "==", false),
  ];

  if (statusFilter !== "all" && statusFilter !== "") {
    constraints.push(where("status", "==", statusFilter));
  }

  // Normalize search term
  const isIdSearch = /\d/.test(searchTerm);
  const normalizedSearch = isIdSearch 
    ? searchTerm.trim() 
    : searchTerm.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

  // Handle Search using prefix logic on userName or studentId
  if (normalizedSearch) {
    const searchField = isIdSearch ? "studentId" : "userName";
    constraints.push(where(searchField, ">=", normalizedSearch));
    constraints.push(where(searchField, "<=", normalizedSearch + "\uf8ff"));
    constraints.push(orderBy(searchField));
  } else {
    constraints.push(orderBy("updatedAt", "desc"));
  }

  // Apply pagination
  constraints.push(limit(pageSize));
  if (lastVisibleDoc) {
    constraints.push(startAfter(lastVisibleDoc));
  }

  const q = query(collection(db, "fees"), ...constraints);
  const snapshot = await getDocs(q);

  const docs = snapshot.docs.map((doc) => {
    const data = { id: doc.id, ...doc.data() } as Fee;
    // Granular caching
    cacheService.set(CACHE_KEYS.feeDoc(doc.id), data, CACHE_DURATIONS.FEES);
    return data;
  });


  return {
    docs,
    lastVisible: snapshot.docs[snapshot.docs.length - 1] || null,
    hasMore: snapshot.docs.length === pageSize,
  };
};

/**
 * Gets total count of fee documents for a specific title and filter with search.
 */
export const getFeesCount = async (
  orgId: string,
  feeItemId: string,
  statusFilter: string = "all",
  searchTerm: string = ""
) => {
  return cacheService.getOrFetch(
    CACHE_KEYS.feesCount(orgId, feeItemId, statusFilter, searchTerm),
    async () => {
      const constraints: any[] = [
        where("orgId", "==", orgId),
        where("feeItemId", "==", feeItemId),
        where("isArchived", "==", false),
      ];

      if (statusFilter !== "all" && statusFilter !== "") {
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

      const q = query(collection(db, "fees"), ...constraints);
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    },
    CACHE_DURATIONS.COUNTS
  );
};

export const getFeeSubmissionsCount = async (
  orgId: string,
  feeId: string,
  statusFilter: string = "all",
  searchTerm: string = ""
) => {
  return cacheService.getOrFetch(
    CACHE_KEYS.feeSubmissionCount(orgId, feeId, statusFilter, searchTerm),
        async () => {
        let constraints: any[] = [
            where("orgId", "==", orgId),
            where("paymentType", "in", ["bulk", "fees"]),
            where("itemKeys", "array-contains", feeId),
            where("isArchived", "==", false),
        ];

        if (statusFilter !== "all" && statusFilter !== "") {
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
            constraints.push(orderBy(searchField));
        } else {
            constraints.push(orderBy("submittedAt", "desc"));
        }
        const q = query(collection(db, "proofOfPayments"), ...constraints);
        const snapshot = await getCountFromServer(q);
        return snapshot.data().count;
    },
    CACHE_DURATIONS.COUNTS
  );
};

/**
 * Fetches globally aggregated payment submissions for a specific fee.
 * Note: If no global indexing by title exists in proofOfPayments, 
 * this might need a Collection Group query or a title-indexed query.
 */
export const fetchFeeSubmissionsPaginated = async (
  orgId: string,
  feeItemId: string,
  pageSize: number = 9,
  lastVisibleDoc: any = null,
  statusFilter: string = "all",
  searchTerm: string = ""
) => {
  // We use proofOfPayments for a global "submissions" view across all students
  let constraints: any[] = [
    where("orgId", "==", orgId),
    where("paymentType", "in", ["bulk", "fees"]),
    where("isArchived", "==", false),
  ];

  if (statusFilter !== "all" && statusFilter !== "") {
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
    constraints.push(orderBy(searchField));
  } else {
    constraints.push(orderBy("submittedAt", "desc"));
  }

  constraints.push(limit(pageSize));
  if (lastVisibleDoc) {
    constraints.push(startAfter(lastVisibleDoc));
  }

  const q = query(collection(db, "proofOfPayments"), ...constraints);
  const snapshot = await getDocs(q);

  // Since we don't have feeTitle indexed at root in proofOfPayments yet, 
  // we filter by title in metadata if possible, but Firestore can't do that.
  // For now, we fetch recent fee payments for the org.
  let docs = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  docs = docs.filter((doc : any) => doc.itemKeys?.includes(feeItemId));
  return {
    docs,
    lastVisible: snapshot.docs[snapshot.docs.length - 1] || null,
    allSnapshots: snapshot.docs,
    hasMore: snapshot.docs.length === pageSize,
  };
};

export async function fetchFee(feeId: string): Promise<Fee | null> {
    return cacheService.getOrFetch(
        CACHE_KEYS.feeDoc(feeId),
        async () => {
            const feeRef = doc(db, "fees", feeId);
            const snapshot = await getDoc(feeRef);
            if (snapshot.exists()) {
                return { id: snapshot.id, ...snapshot.data() } as Fee;
            }
            return null;
        },
        CACHE_DURATIONS.FEES
    );
}

export async function fetchPaymentLogs(feeId: string) {
    return cacheService.getOrFetch(
        CACHE_KEYS.feeLogs(feeId),
        async () => {
            const logsRef = collection(db, "fees", feeId, "paymentHistory");
            const q = query(logsRef, orderBy("paidAt", "desc"));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        },
        CACHE_DURATIONS.FEES
    );
}

export const getFeeByStudentId = async (studentId: string) => {
    // Hoist term for key correctness — getActiveTerm() is cached (no extra DB read).
    const term = await getActiveTerm();
    return cacheService.getOrFetch(
        `fees:student:${studentId}:${term?.AY}-${term?.semester}`,
        async () => {
            const feeRef = collection(db, "fees");
            const q = query(
                feeRef,
                where("studentId", "==", studentId),
                where("isArchived", "==", false),
                where("academicYear", "==", term?.AY || ""),
                where("semester", "==", term?.semester || ""),
            );
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const feeDoc = snapshot.docs[0];
                return {
                    id: feeDoc.id,
                    ...feeDoc.data()
                } as Fee;
            }
            return null;
        },
        CACHE_DURATIONS.FEES
    );
}

export const archiveFeeDocuments = async (feeItemId: string) => {
    try {
        const userIdMap = new Map<string, string>(); 
        const feeItemRef = doc(db, "feeItems", feeItemId);
        const feeItemSnap = await getDoc(feeItemRef);
        
        if (!feeItemSnap.exists()) {
            throw new Error(`Fee item with ID ${feeItemId} does not exist.`);
        }

        const orgId = feeItemSnap.data().orgId || '';
        
        // 1. Mark parent feeItem as archived
        await updateDoc(feeItemRef, { 
            isArchived: true,
            updatedAt: Timestamp.now()
        });

        // 2. Query all student fee documents for this feeItem
        const feeRef = collection(db, "fees");
        let q = query(
            feeRef,
            where("feeItemId", "==", feeItemId),
            where("isArchived", "==", false)
        );
        
        const snapshot = await getDocs(q);
        const batchSize = 200; 

        if (!snapshot.empty) {
            for (let i = 0; i < snapshot.docs.length; i += batchSize) {
                const chunk = snapshot.docs.slice(i, i + batchSize);
                const batch = writeBatch(db);
                
                chunk.forEach((feeDoc) => {
                    userIdMap.set(feeDoc.data().userId, feeDoc.id);
                    batch.update(feeDoc.ref, { 
                        isArchived: true,
                        updatedAt: Timestamp.now()
                    });
                });
                
                await batch.commit();
            }
        }

        const userIds = Array.from(userIdMap.keys());

        if (userIds.length > 0) {
            const clearanceStatusRef = collection(db, "clearanceStatus");
            const maxInQuerySize = 30; 

            for (let i = 0; i < userIds.length; i += maxInQuerySize) {
                const userIdChunk = userIds.slice(i, i + maxInQuerySize);
                
                const clearanceQuery = query(
                    clearanceStatusRef,
                    where("userId", "in", userIdChunk),
                    where("isArchived", "==", false)
                );
                
                const clearanceSnapshot = await getDocs(clearanceQuery);
                
                if (!clearanceSnapshot.empty) {
                    const batch = writeBatch(db);
                    
                    clearanceSnapshot.forEach((clearanceDoc) => {
                        const currentUserId = clearanceDoc.data().userId;
                        const correspondingFeeId = userIdMap.get(currentUserId);
                        
                        if (correspondingFeeId) {
                            const currentData = clearanceDoc.data();
                            const currentBlockingItems = currentData.blockingItems || {};

                            const checkRemainingItemKeys = Object.keys(currentBlockingItems).filter(key => key !== correspondingFeeId);

                            const updatePayLoad: Record<string, any> = {
                                [`blockingItems.${correspondingFeeId}`]: deleteField(),
                                updatedAt: Timestamp.now()
                            }
                            
                            if(checkRemainingItemKeys.length == 0) {
                                updatePayLoad.status = "cleared";
                            }

                            batch.update(clearanceDoc.ref, updatePayLoad);
                        }
                    });
                    
                    await batch.commit();
                    
                    // Trigger recalculation for each student to ensure status is 100% correct
                    for (const userId of userIdChunk) {
                        recalculateClearanceStatus(userId).catch(console.error);
                    }
                }
            }
        }
        
        cacheService.invalidateByPrefix(`fees:org:${orgId}`);
        cacheService.invalidate(CACHE_KEYS.clearanceAll(orgId));
        cacheService.invalidateByPrefix(`fees:count:${orgId}`);
        cacheService.invalidateByPrefix(`clearance:stats:${orgId}`);
        cacheService.invalidateByPrefix(`clearance:count:${orgId}`);
        cacheService.invalidateByPrefix(`fees:totalPaidAmountCount:`);
        cacheService.invalidateByPrefix(`fees:totalRejectedAmountCount:`);
        cacheService.invalidateByPrefix(`fees:totalUnpaidAmountCount:`);
        cacheService.invalidateByPrefix(`fees:totalPendingAmountCount:`);
        
        // fetchFeesForOrg(orgId).catch(console.error);
        // fetchUnpaidFeesForOrg().catch(console.error);
    } catch (error) {
        console.error("Error archiving fee item and documents:", error);
        throw error;
    }
}

export const recordBulkManualPaymentAndUpdateClearance = async (
    studentId: string,
    items: { refId: string; title: string; amount: number; paymentType: string, parentFineId?: string }[],
    totalAmount: number,
    method: "gcash" | "cash" | "bank_transfer" | "waiver",
    adminId: string,
    adminName: string,
    overallPaymentType: PaymentType, // "fee", "fin", or "bulk payment"
    ref?: string,
    receipt?: string,
    term?: Term
) => {
    try {
        if (isNaN(totalAmount) || totalAmount <= 0) {
            throw new Error("Invalid total payment amount");
        }

        const studentDataDoc = await getDoc(doc(db, "users", studentId));
        const studentData = studentDataDoc.data();
        const currentUser = await getCurrentUserData() as unknown as Member; // Assuming this is available in your scope

        // Create references for the single unified logs
        const paymentProofRef = doc(collection(db, "proofOfPayments"));
        
        // Note: Since this covers multiple fees/fines, creating a root-level payment history 
        // makes more sense than putting it inside a single fee's subcollection.
        const id = buildClearanceId(studentId, currentUser.orgId, currentUser.accessLevel as number, term!);
        const clearanceRef = doc(db, 'clearanceStatus', id);

        await runTransaction(db, async (transaction) => {
            // ==========================================
            // 1. ALL READS (Must happen before writes)
            // ==========================================
            const itemDocsToUpdate = [];
            const logsToUpdate = []; // Array to stage log updates for Phase 2
            const logsToWrite = []; // Array to stage writes for Phase 2
            const finesIdsToExclude = items.filter(i => i.paymentType === PaymentType.FINES && i.parentFineId).map(i => i.refId) || [];

            let fineParentId = "";
            let totalFinesPaid = 0;
            let finesLogged = false;

            for (const item of items) {
                // Determine which collection to pull from based on the item type
                const collectionName = item.paymentType === PaymentType.FEES ? "fees" : "fines"; 
                let itemRef;
                let bulkPaymentHistoryRef;

                if (item.parentFineId) {
                    fineParentId = item.parentFineId;
                    itemRef = doc(db, "fines", item.parentFineId, "fineItems", item.refId);
                    
                    logsToUpdate.push({
                        ref: itemRef,
                        data: {isPaid: true}
                    });

                    totalFinesPaid += item.amount;

                    if (!finesLogged) {
                        bulkPaymentHistoryRef = doc(collection(db, "fines", item.parentFineId, "paymentHistory"));
                        finesLogged = true; // Ensure we only log once for the fine, even if multiple items are paid
                    }
                } else {
                    itemRef = doc(db, "fees", item.refId);
                    bulkPaymentHistoryRef = doc(collection(db, "fees", item.refId, "paymentHistory"));
                }

                // Execute the READ
                const itemDoc = await transaction.get(itemRef);
                
                if (!itemDoc.exists()) {
                    throw new Error(`Document with ID ${item.refId} does not exist in ${collectionName}.`);
                }

                // Stage the read data
                itemDocsToUpdate.push({
                    ref: itemRef,
                    title: item.title,
                    data: itemDoc.data(),
                    paymentAmount: item.amount,
                    refId: item.refId,
                    academicYear: item.paymentType === PaymentType.FEES ? itemDoc.data()?.academicYear : term!.AY,
                    semester: item.paymentType === PaymentType.FEES ? itemDoc.data()?.semester : term!.semester,
                });
                if (bulkPaymentHistoryRef) {
                    // Stage the log data for the WRITE phase
                    const newLog = {
                        id: bulkPaymentHistoryRef.id,
                        paymentNumber: Date.now(),
                        amount: totalAmount,
                        paymentMethod: method,
                        paymentProofId: paymentProofRef.id,
                        gcashReference: method === "gcash" && ref ? ref : null,
                        status: PaymentStatus.VERIFIED,
                        paidAt: Timestamp.now(),
                        verifiedBy: adminId,
                        verifiedByName: adminName,
                        verifiedAt: Timestamp.now(),
                        rejectionReason: null,
                        notes: `Manual payment recorded from clearance page. Items: ${items.map(i => i.refId).join(', ')}`,
                        paymentType: overallPaymentType,
                        metadata: { items: itemDocsToUpdate.map(i => ({
                            refId: i.refId,
                            title: i.title,
                            amount: i.paymentAmount,
                            paymentType: i.data.paymentType || (item.paymentType), // Fallback
                            parentFineId: i.data.parentFineId || "",
                            academicYear: i.academicYear,
                            semester: i.semester
                        })) },
                        itemKeys: itemDocsToUpdate.map(i => i.data.feeItemId ?? i.refId), // fallback to refId
                        createdAt: Timestamp.now(),
                    };

                    logsToWrite.push({
                        ref: bulkPaymentHistoryRef,
                        data: newLog
                    });
                }
            }

            for(const log of logsToUpdate){
                transaction.update(log.ref, log.data);
            }
            // Write all the logs
            for (const log of logsToWrite) {
                transaction.set(log.ref, log.data);
            }
            

            transaction.set(paymentProofRef, {
                id: paymentProofRef.id,
                orgId: currentUser?.orgId || "",
                userId: studentId,
                studentId: studentData?.studentId || "",
                userName: `${studentData?.firstName || ""} ${studentData?.lastName || ""}`.trim(),
                paymentType: overallPaymentType, // "fee", "fin", or "bulk payment"
                referenceId: "bulk_transaction", // Can't be a single fee ID anymore
                paymentHistoryId: [], // No payment history for bulk payment
                senderNumber: "",
                referenceNumber: method === "gcash" && ref ? ref : "",
                amount: totalAmount,
                imageUrl: "",
                status: PaymentStatus.VERIFIED,
                submittedAt: Timestamp.now(),
                verifiedBy: adminId,
                verifiedByName: adminName,
                verifiedAt: Timestamp.now(),
                rejectionReason: "",
                notes: "Manual payment recorded from clearance page",
                metadata: { items: itemDocsToUpdate.map(i => ({
                    refId: i.refId,
                    title: i.title,
                    amount: i.paymentAmount,
                    paymentType: i.data.paymentType || "bulk", 
                    parentFineId: i.data.parentFineId || "",
                    academicYear: i.academicYear,
                    semester: i.semester
                })) },
                itemKeys: itemDocsToUpdate.map(i => i.data.feeItemId ?? i.refId), // fallback to refId
                receiptCode: receipt,
                isArchived: false,
                updatedAt: Timestamp.now(),
                academicYear: term!.AY,
                semester: term!.semester,
            });

            const clearanceUpdates: Record<string, any> = {};

            let balanceOverall = 0;

            for (const { ref: itemRef, data, paymentAmount, refId } of itemDocsToUpdate) {
                const currentPaidAmount = data.paidAmount || 0;
                const totalRequiredAmount = data.amount || 0;

                const newPaidAmount = currentPaidAmount + paymentAmount;
                const newBalance = Math.max(0, totalRequiredAmount - newPaidAmount);
                
                let newStatus: "pending" | "partial" | "paid" = "pending";
                if (newBalance <= 0) {
                    newStatus = "paid";
                } else if (newPaidAmount > 0) {
                    newStatus = "partial";
                }
                if (!finesIdsToExclude.includes(refId)) {
                    transaction.update(itemRef, {
                        paidAmount: newPaidAmount,
                        balance: newBalance,
                        status: newStatus,
                    });
                }

                // Prepare fields for the single clearance document update
                clearanceUpdates[`blockingItems.${refId}.balance`] = newBalance;
                clearanceUpdates[`blockingItems.${refId}.status`] = newBalance <= 0 ? "paid" : "unpaid";
                clearanceUpdates[`blockingItems.${refId}.pendingReview`] = false;
                
                balanceOverall += newBalance;
            }
            clearanceUpdates[`status`] = balanceOverall == 0 ? "cleared" : "not_cleared" ;
            if (fineParentId !== "" && totalFinesPaid > 0) {
                await recalculateFines(fineParentId, null, totalFinesPaid, null, null);
            }
            if (Object.keys(clearanceUpdates).length > 0) {
                transaction.update(clearanceRef, clearanceUpdates);
            }

        const toDeductFees = totalAmount - totalFinesPaid;
        await updateFineStats(`${term!.AY}-${term!.semester}-${currentUser.orgId}`, 0,totalFinesPaid);
        await updateFeeStats(`${term!.AY}-${term!.semester}-${currentUser.orgId}`, 0,toDeductFees);
        });

        await recalculateClearanceStatus(studentId);
        const orgId = currentUser.orgId || '';
        // Granular Invalidation
        items.forEach(item => {
            if (item.paymentType === PaymentType.FEES) {
                cacheService.invalidate(CACHE_KEYS.feeDoc(item.refId));
                cacheService.invalidate(CACHE_KEYS.feeLogs(item.refId));
            }
        });
        cacheService.invalidate(CACHE_KEYS.clearanceDoc(id));
        cacheService.invalidate(CACHE_KEYS.feeStatusForClearance(studentId, orgId));
        cacheService.invalidate(CACHE_KEYS.proofOfPayments(orgId));

        // cacheService.invalidate(CACHE_KEYS.feesForOrg(orgId));
        // cacheService.invalidate(CACHE_KEYS.feesUnpaid(orgId));
        cacheService.invalidate(CACHE_KEYS.clearanceAll(orgId));
        cacheService.invalidateByPrefix(`fees:count:${orgId}`);
        cacheService.invalidateByPrefix(`clearance:stats:${orgId}`);
        cacheService.invalidateByPrefix(`clearance:count:${orgId}`);
        cacheService.invalidateByPrefix(`payments:count:${orgId}`);

        // fetchFeesForOrg(orgId).catch(console.error);
        // fetchUnpaidFeesForOrg().catch(console.error);
    } catch (error) {
        console.error("Error processing bulk manual payment and clearance:", error);
        throw error;
    }
};

export const recordManualPaymentAndUpdateClearance = async (
    feeId: string, 
    amount: string, 
    method: "gcash" | "cash" | "bank_transfer" | "waiver", 
    adminId: string,   
    studentId: string,
    adminName: string,
    ref?: string,
    receipt?: string,
    senderNumber?: string,
    termPeriod?: any
) => {
    try {
        const paymentAmount = parseFloat(amount);
        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            throw new Error("Invalid payment amount");
        }
        const currentUser = await getCurrentUserData() as unknown as Member;
        const term = termPeriod || await getActiveTerm();
        const feeRef = doc(db, "fees", feeId);
        const paymentProofRef = doc(collection(db, "proofOfPayments"));
        const subCollectionRef = collection(feeRef, "paymentHistory");
        const newLogRef = doc(subCollectionRef);
        const id = buildClearanceId(studentId, currentUser.orgId, currentUser.accessLevel as number, term!);
        const clearanceRef = doc(db, 'clearanceStatus', id);

        const studentData = await getDoc(doc(db, "users", studentId));

        let overallBalance = 0;

        await runTransaction(db, async (transaction) => {
            const feeDoc = await transaction.get(feeRef);
            if (!feeDoc.exists()) {
                throw new Error(`Fee document with ID ${feeId} does not exist.`);
            }
            
            const feeData = feeDoc.data() as Fee;
            const currentPaidAmount = feeData.paidAmount || 0;
            const totalRequiredAmount = feeData.amount || 0;

            const newPaidAmount = currentPaidAmount + paymentAmount;
            const newBalance = Math.max(0, totalRequiredAmount - newPaidAmount);
            
            let newStatus: "pending" | "partial" | "paid" = "pending";
            if (newBalance <= 0) {
                newStatus = "paid";
            } else if (newPaidAmount > 0) {
                newStatus = "partial";
            }

            const newLog: PaymentLog = {
                id: newLogRef.id,
                paymentNumber: Date.now(), 
                amount: paymentAmount,
                paymentMethod: method,
                paymentProofId: paymentProofRef.id,
                status: PaymentStatus.VERIFIED,
                paidAt: Timestamp.now(),
                verifiedBy: adminId, 
                verifiedByName: adminName, 
                verifiedAt: Timestamp.now(),
                rejectionReason: null,
                notes: "Manual payment recorded by admin",
                metadata: null,
                createdAt: Timestamp.now(),
            };

            transaction.set(newLogRef, newLog);
            
            transaction.set(paymentProofRef, {
                id: paymentProofRef.id,
                orgId: currentUser.orgId,
                userId: studentId,
                studentId: studentData.data()?.studentId,
                userName: studentData.data()?.firstName + " " + studentData.data()?.lastName,
                paymentType: PaymentType.FEES,
                referenceId: feeId,
                paymentHistoryId: newLogRef.id,
                senderNumber: method === "gcash" && senderNumber ? senderNumber : "",
                referenceNumber: method === "gcash" && ref ? ref : "",
                amount: paymentAmount,
                imageUrl: "",
                status: PaymentStatus.VERIFIED,
                submittedAt: Timestamp.now(),
                verifiedBy: adminId,
                verifiedByName: adminName,
                verifiedAt: Timestamp.now(),
                rejectionReason: "",
                notes: "Manual payment recorded by admin",
                metadata: {
                    items: [{
                        refId: feeId,
                        title: feeData.title,
                        amount: paymentAmount,
                        paymentType: PaymentType.FEES,
                        parentFineId: "",
                        academicYear: feeData.academicYear,
                        semester: feeData.semester,
                    }]
                },
                itemKeys: [feeData.feeItemId],
                receiptCode: receipt,
                isArchived: false,
                updatedAt: Timestamp.now(),
                academicYear: feeData.academicYear,
                semester: feeData.semester,
            })

            transaction.update(feeRef, {
                paidAmount: newPaidAmount,
                balance: newBalance,
                status: newStatus,
            });


            transaction.update(clearanceRef, {
                [`blockingItems.${feeId}.balance`]: newBalance,
                [`blockingItems.${feeId}.status`]: newBalance <= 0 ? "paid" : "unpaid", 
                [`blockingItems.${feeId}.pendingReview`]: false,
            });
        });

        const clearance = await getDoc(clearanceRef);
        if (clearance.exists()) {
            const data = clearance.data();

            const blockingItems = data.blockingItems || {};
            const allCleared = Object.values(blockingItems).every(
                (item: any) => item.status === "paid" || item.balance <= 0
            );

            data.status = allCleared ? "cleared" : "not_cleared";
            await setDoc(clearanceRef, data);
        }
        
        const orgId = currentUser.orgId || '';

        await updateFeeStats(`${term!.AY}-${term!.semester}-${orgId}`, 0, paymentAmount);
        await recalculateClearanceStatus(studentId);

        cacheService.invalidate(CACHE_KEYS.feeDoc(feeId));
        cacheService.invalidate(CACHE_KEYS.feeLogs(feeId));
        cacheService.invalidate(CACHE_KEYS.clearanceDoc(id));
        cacheService.invalidate(CACHE_KEYS.feeStatusForClearance(studentId, orgId));
        cacheService.invalidate(CACHE_KEYS.proofOfPayments(orgId));

        return newLogRef.id;
    } catch (error) {
        console.error("Error processing manual payment and clearance:", error);
        throw error;
    }
}

export const getFee = async (feeId: string) => {
    try {
        const feeRef = doc(db, "fees", feeId);
        const feeDoc = await getDoc(feeRef);
        if (!feeDoc.exists()) {
            throw new Error(`Fee document with ID ${feeId} does not exist.`);
        }
        return feeDoc.data() as Fee;
    } catch (error) {
        console.error("Error getting fee:", error);
        throw error;
    }
}

export const approvePaymentTransaction = async (feeId: string, paymentLogId: string, userId: string, term?: Term) => {
    try {
        const feeRef = doc(db, "fees", feeId);
        const paymentLogRef = doc(feeRef, "paymentHistory", paymentLogId);
        const currentUser = await getCurrentUserData() as unknown as Member;
        const userId = await runTransaction(db, async (transaction) => {
            const feeDoc = await transaction.get(feeRef);
            const paymentLogDoc = await transaction.get(paymentLogRef);

            if (!feeDoc.exists()) {
                throw new Error(`Fee document with ID ${feeId} does not exist.`);
            }

            if (!paymentLogDoc.exists()) {
                throw new Error(`Payment log with ID ${paymentLogId} does not exist.`);
            }

            const feeData = feeDoc.data() as Fee;
            const paymentLogData = paymentLogDoc.data() as PaymentLog;

            const currentPaidAmount = feeData.paidAmount || 0;
            const paymentAmount = paymentLogData.amount;
            const newPaidAmount = currentPaidAmount + paymentAmount;
            const newBalance = Math.max(0, feeData.amount - newPaidAmount);
            let newStatus = "pending";
            if (newBalance <= 0) {
                newStatus = "paid";
            } else if (newPaidAmount > 0) {
                newStatus = "partial";
            }

            transaction.update(paymentLogRef, {
                status: PaymentStatus.VERIFIED,
                verifiedBy: userId,
                verifiedByName: currentUser.firstName + " " + currentUser.lastName, 
                verifiedAt: Timestamp.now(),
                "metadata.updatedAt": Timestamp.now(),
            });

            if (paymentLogData.paymentProofId) {
                const proofRef = doc(db, "proofOfPayments", paymentLogData.paymentProofId);
                transaction.update(proofRef, {
                    status: PaymentStatus.VERIFIED,
                    verifiedBy: userId,
                    verifiedByName: currentUser.firstName + " " + currentUser.lastName,
                    verifiedAt: Timestamp.now(),
                    "metadata.updatedAt": Timestamp.now(),
                });
            }

            transaction.update(feeRef, {
                paidAmount: newPaidAmount,
                balance: newBalance,
                status: newStatus,
            });

            // Update Student's Clearance Document
            const id = buildClearanceId(feeData.userId, currentUser.orgId, currentUser.accessLevel as number, term!);
            const clearanceRef = doc(db, 'clearanceStatus', id);
            transaction.update(clearanceRef, {
                [`blockingItems.${feeId}.balance`]: newBalance,
                [`blockingItems.${feeId}.status`]: newBalance <= 0 ? "paid" : "unpaid",
                [`blockingItems.${feeId}.pendingReview`]: false,
            });
            return feeData.userId;
        })

        await recalculateClearanceStatus(userId);
        const orgId = currentUser.orgId || '';
        const term = await getActiveTerm();
        const id = buildClearanceId(userId, currentUser.orgId, currentUser.accessLevel as number, term!);

        cacheService.invalidate(CACHE_KEYS.feeDoc(feeId));
        cacheService.invalidate(CACHE_KEYS.feeLogs(feeId));
        cacheService.invalidate(CACHE_KEYS.clearanceDoc(id));
        cacheService.invalidate(CACHE_KEYS.feeStatusForClearance(id, orgId));
        cacheService.invalidate(CACHE_KEYS.proofOfPayments(orgId));

        // cacheService.invalidate(CACHE_KEYS.feesForOrg(orgId));
        // cacheService.invalidate(CACHE_KEYS.feesUnpaid(orgId));
        // cacheService.invalidate(CACHE_KEYS.clearanceAll(orgId));

        // fetchFeesForOrg(orgId).catch(console.error);
        // fetchUnpaidFeesForOrg().catch(console.error);
        // fetchClearanceDocuments(orgId).catch(console.error);
    } catch (error) {
        console.error("Error approving payment:", error);
        throw error;
    }
}

export const rejectPaymentTransaction = async (feeId: string, paymentLogId: string, userId: string, rejectionReason: string) => {
    try {
        const feeRef = doc(db, "fees", feeId);
        const paymentLogRef = doc(feeRef, "paymentHistory", paymentLogId);
        const currentUser = await getCurrentUserData() as unknown as Member;
        const userId = await runTransaction(db, async (transaction) => {
            const feeDoc = await transaction.get(feeRef);
            const paymentLogDoc = await transaction.get(paymentLogRef);

            if (!feeDoc.exists()) {
                throw new Error(`Fee document with ID ${feeId} does not exist.`);
            }

            if (!paymentLogDoc.exists()) {
                throw new Error(`Payment log with ID ${paymentLogId} does not exist.`);
            }

            const feeData = feeDoc.data() as Fee;
            const paymentLogData = paymentLogDoc.data() as PaymentLog;

            const currentPaidAmount = feeData.paidAmount || 0;
            const paymentAmount = paymentLogData.amount;
            const newPaidAmount = currentPaidAmount - paymentAmount;
            const newBalance = Math.max(0, feeData.amount - newPaidAmount);
            let newStatus = "pending";
            if (newBalance <= 0) {
                newStatus = "paid";
            } else if (newPaidAmount > 0) {
                newStatus = "partial";
            }

            transaction.update(paymentLogRef, {
                status: PaymentStatus.REJECTED,
                verifiedBy: userId,
                verifiedByName: currentUser.firstName + " " + currentUser.lastName, 
                verifiedAt: Timestamp.now(),
                rejectionReason: rejectionReason,
                "metadata.updatedAt": Timestamp.now(),
            });

            if (paymentLogData.paymentProofId) {
                const proofRef = doc(db, "proofOfPayments", paymentLogData.paymentProofId);
                transaction.update(proofRef, {
                    status: PaymentStatus.REJECTED,
                    verifiedBy: userId,
                    verifiedByName: currentUser.firstName + " " + currentUser.lastName,
                    verifiedAt: Timestamp.now(),
                    rejectionReason: rejectionReason,
                    "metadata.updatedAt": Timestamp.now(),
                });
            }

            transaction.update(feeRef, {
                paidAmount: newPaidAmount,
                balance: newBalance,
                status: newStatus,
                "metadata.updatedAt": Timestamp.now(),
            });

            // Update Student's Clearance Document
            const term = await getActiveTerm();
            const id = buildClearanceId(feeData.userId, currentUser.orgId, currentUser.accessLevel as number, term!);
            const clearanceRef = doc(db, 'clearanceStatus', id);
            transaction.update(clearanceRef, {
                [`blockingItems.${feeId}.pendingReview`]: false,
            });
            return feeData.userId;
        })

        await recalculateClearanceStatus(userId);
        const orgId = currentUser.orgId || '';
        const term = await getActiveTerm();
        const id = buildClearanceId(userId, currentUser.orgId, currentUser.accessLevel as number, term!);

        cacheService.invalidate(CACHE_KEYS.feeDoc(feeId));
        cacheService.invalidate(CACHE_KEYS.feeLogs(feeId));
        cacheService.invalidate(CACHE_KEYS.clearanceDoc(id));
        cacheService.invalidate(CACHE_KEYS.feeStatusForClearance(id, orgId));
        cacheService.invalidate(CACHE_KEYS.proofOfPayments(orgId));

        // cacheService.invalidate(CACHE_KEYS.feesForOrg(orgId));
        // cacheService.invalidate(CACHE_KEYS.feesUnpaid(orgId));
        // cacheService.invalidate(CACHE_KEYS.clearanceAll(orgId));

        // fetchFeesForOrg(orgId).catch(console.error);
        // fetchUnpaidFeesForOrg().catch(console.error);
        // fetchClearanceDocuments(orgId).catch(console.error);
    } catch (error) {
        console.error("Error rejecting payment:", error);
        throw error;
    }
}

// export const updateFeeItemsInBatches = async () => {
//     const feeItemId = "5HpLvHfmHZ0qQAvUZqE3";
//     const feeRef = collection(db, "fees");
//     const q = query(
//         feeRef, 
//         where("isArchived", "==", false)
//     );

//     try {
//         const feeSnapshot = await getDocs(q);
//         const docs = feeSnapshot.docs;
//         const totalDocs = docs.length;
        
//         console.log(`Starting update for ${totalDocs} documents...`);

//         let batch = writeBatch(db);
//         let count = 0;
//         let totalUpdated = 0;

//         for (let i = 0; i < totalDocs; i++) {
//             const docRef = doc(db, "fees", docs[i].id);
            
//             // Define your updates here
//             batch.update(docRef, { 
//                 // example: updatedAt: new Date() 
//                 feeItemId: feeItemId,
//                 updatedAt: new Date().toISOString()
//             });

//             count++;

//             // Firestore batch limit is 500
//             if (count === 500) {
//                 await batch.commit();
//                 totalUpdated += count;
//                 console.log(`Committed ${totalUpdated} / ${totalDocs}`);
                
//                 // Reset batch and counter
//                 batch = writeBatch(db);
//                 count = 0;
//             }
//         }

//         // Commit any remaining documents in the final batch
//         if (count > 0) {
//             await batch.commit();
//             totalUpdated += count;
//             console.log(`Final commit finished. Total updated: ${totalUpdated}`);
//         }

//         return { success: true, updatedCount: totalUpdated };

//     } catch (error) {
//         console.error("Batch update failed: ", error);
//         throw error;
//     }
// }
