import { db } from "@/firebase/firebase.config";
import { getAllUsers, getCurrentUserData, getUserById } from "@/firebase/users";
import { collection, addDoc, writeBatch, doc, CollectionReference, DocumentData, Timestamp, getCountFromServer, setDoc, query, where, getDocs, increment, runTransaction, and, or, limit } from "firebase/firestore";
import { getFineTypeById } from "../read/fineType";
import { Member, MemberData } from "@/features/organization/members/types";
import { getNonAttendeesForEvent, getPartialAttendeesForEvent } from "@/firebase/attendance";
import { disableFineGeneration, getEventById } from "@/firebase/events";
import { getFinesByStudents } from "../read/fines";
import { recalculateFines } from "../update/recalculate";
import { updateFineItemCount } from "../update/updateFineItemCount";
import { FineStatus } from "@/constants/status";
import { BulkFinesProgress, BulkFinesResult, FineGenerationPhase, FineGenerationProgress, OnFineProgress, StudentFines } from "@/features/organization/fines/types";
import { Event } from "@/features/organization/events/types";
import { updateFirstFineIssuedAt, updateLastFineIssuedAt } from "../update/fines";
import { PaymentType } from "@/constants/types";
import { recalculateClearanceStatus, buildClearanceId } from "@/firebase/clearance";
import { getActiveTerm } from "@/firebase/term";
import { cacheService, CACHE_KEYS } from "@/services/cacheService";
import { updateFineStats } from "@/firebase/stats/update/updateStats";

const finesCollection: CollectionReference<DocumentData> = collection(
    db,
    "fines"
  );

  // Centralized error handler
const handleFirestoreError = (error: any, context: string) => {
    console.error(`Error ${context}:`, error);
    // Re-throwing allows the calling UI to handle the failed state.
    throw new Error(`Failed to ${context}.`);
};

  export const createFinePerStudent = async (userId: string, user: Member) => {
    try {
        const currentUser = await getCurrentUserData();
        if (!currentUser) {
            console.error("No authenticated user found.");
            return null;
        }
    // const user = await getUserById(userId);
    // if (!user) {
    //     return null;
    // }
        const term = await getActiveTerm();
      const fineData = {
        orgId: currentUser.orgId,
        userId: userId,
        studentId: user.studentId,
        userName: `${user?user.firstName:"Unknown"} ${user?user.lastName : ""}`,
        academicYear: term!.AY,
        semester: term!.semester, 
        accumulatedAmount: 0,
        paidAmount: 0,
        balance: 0,
        status: FineStatus.UNPAID,
        fineItemsCount: 0,
        firstFineIssuedAt: null,
        lastFineIssuedAt: null,
        dueDate: null,
        waivedAmount: null,
        waivedBy: null,
        waivedReason: null,
        waivedAt: null,
        remarks: null,
        metadata: {
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            isArchived: false,
        }
      };
      const docRef = await addDoc(finesCollection, fineData);

        await recalculateClearanceStatus(userId);
        // cacheService.invalidate(CACHE_KEYS.clearanceDoc(userId));
        
    } catch (error) {
      handleFirestoreError(error, `creating fine document on ID ${userId}`);
      return null;
    }
  }

export const createBulkFines = async (
  onProgress?: (update: BulkFinesProgress) => void
): Promise<BulkFinesResult> => {

  const result: BulkFinesResult = {
    success: false,
    totalUsers: 0,
    committed: 0,
    failedAtBatch: null,
  };

  const report = (phase: BulkFinesProgress["phase"], message: string, extra?: Partial<BulkFinesProgress>) =>
    onProgress?.({ phase, message, committed: result.committed, totalUsers: result.totalUsers, ...extra });

  try {
    const currentUser = await getCurrentUserData() as unknown as Member;
    const term = await getActiveTerm();
    if (!currentUser) {
      report("error", "No authenticated user found.");
      return result;
    }

    const doneSeeding = await getDocs(query(collection(db, "fines",),
      where("orgId", "==", currentUser.orgId),
      where("academicYear", "==", term!.AY),
      where("semester", "==", term!.semester),
      limit(1)));
    if (doneSeeding.size > 0) {
      report("done", "Fines Container already created for this term. No action taken.");
      result.success = true;
      return result;
     }

    report("preflight", "Fetching all users…");
    const users = await getAllUsers();
    if (!users || users.length === 0) {
      report("done", "No users found to create fines for.");
      result.success = true;
      return result;
    }

    result.totalUsers = users.length;
    const batchSize = 20;
    const totalBatches = Math.ceil(users.length / batchSize);
    report("writing", `Starting — ${users.length} users, ${totalBatches} batches`);

    for (let i = 0; i < users.length; i += batchSize) {
      const batchNum  = Math.floor(i / batchSize) + 1;
      const batchSlice = users.slice(i, i + batchSize);
      const batch     = writeBatch(db);

      for (const user of batchSlice) {
        // Guard against missing member data
        if (!user.member) {
          console.warn(`User ${user.id} has no member data — skipping.`);
          continue;
        }

        const fineData = {
          orgId:      currentUser.orgId,
          userId:     user.id,
          userName:   `${user.member.firstName} ${user.member.lastName}`,
          studentId:  user.member.studentId,
          academicYear: term!.AY, 
          semester:     term!.semester,
          accumulatedAmount: 0,
          paidAmount:        0,
          balance:           0,
          status:            FineStatus.UNPAID,
          fineItemsCount:    0,
          firstFineIssuedAt: null,
          lastFineIssuedAt:  null,
          dueDate:           null,
          waivedAmount:      null,
          waivedBy:          null,
          waivedReason:      null,
          waivedAt:          null,
          remarks:           null,
          metadata: {
            createdAt:  Timestamp.now(),
            updatedAt:  Timestamp.now(),
            isArchived: false,
          },
        };

        const fineDocRef = doc(finesCollection);
        batch.set(fineDocRef, fineData);
      }

      // If a batch throws, we know exactly where it stopped
      try {
        await batch.commit();
      } catch (batchError) {
        result.failedAtBatch = batchNum;
        handleFirestoreError(batchError, `batch ${batchNum}/${totalBatches}`);
        report("error", `Failed at batch ${batchNum}/${totalBatches} — ${result.committed} users committed before failure.`);
        return result;
      }

      result.committed += batchSlice.length;
      report("writing", `Batch ${batchNum}/${totalBatches} committed`, { batchNum, totalBatches });

      // Trigger clearance recalculation for all users in this batch
      await Promise.all(batchSlice.map(user => recalculateClearanceStatus(user.id!)));
    }

    const orgId = currentUser.orgId || '';
    // cacheService.invalidate(CACHE_KEYS.clearanceAll(orgId));
    

    result.success = true;
    report("done", `All ${result.committed} fine documents created successfully.`);
    return result;

  } catch (error) {
    handleFirestoreError(error, "creating fines documents in bulk");
    report("error", "Unexpected error during bulk fine creation.");
    return result;
  }
};


// ── Timeout wrapper ───────────────────────────────────────────────────────
const withTimeout = <T>(promise: Promise<T>, ms: number, label: string): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms — ${label}`)), ms)
    ),
  ]);

function makeSnapshot(
  phase: FineGenerationPhase,
  counts: { absentTotal: number; absentDone: number; partialTotal: number; partialDone: number },
  message: string,
  batch?: { batchNum: number; totalBatches: number }
): FineGenerationProgress {
  return {
    phase,
    message,
    ...counts,
    ...(batch ?? {}),
  };
}

const prepareFineItem = async (fine: StudentFines, currentUser: Member) => {
  const subColRef = collection(db, "fines", fine.id!, "fineItems");
  const countSnapshot = await getCountFromServer(subColRef);
  const itemNumber = (countSnapshot.data().count ?? 0) + 1;
  const fineItemRef = doc(subColRef);
  const term = await getActiveTerm();
  const clearanceId = buildClearanceId(fine.userId, currentUser.orgId, currentUser.accessLevel as number, term!);
  const clearanceRef = doc(db, "clearanceStatus", clearanceId);
  return { fine, itemNumber, fineItemRef, clearanceRef };
};

/**
 * Gets or creates a parent `fines` document for each student.
 * If no doc exists yet for the active term, one is created on-the-fly
 * so that `generateFinesOnEvent` can still write fine items.
 */
const getOrCreateFinesForStudents = async (
  students: MemberData[],
  term: { AY: string; semester: string },
  currentUser: Member,
  orgId: string
): Promise<StudentFines[]> => {
  if (students.length === 0) return [];

  // 1. Fetch any already-existing docs for this term
  const existing = await getFinesByStudents(students);
  const existingMap = new Map(existing.map(f => [f.studentId, f]));

  // 2. For students without an existing doc, create one now
  const missing = students.filter(s => !existingMap.has(s.member.studentId));

  if (missing.length > 0) {
    const batch = writeBatch(db);
    const now = Timestamp.now();
    const newDocs: StudentFines[] = [];

    for (const student of missing) {
      const fineDocRef = doc(finesCollection);
      const fineData: StudentFines = {
        id: fineDocRef.id,
        orgId: orgId,
        userId: student.id!,
        studentId: student.member.studentId,
        userName: `${student.member.firstName} ${student.member.lastName}`,
        academicYear: term.AY,
        semester: term.semester,
        accumulatedAmount: 0,
        paidAmount: 0,
        balance: 0,
        status: FineStatus.UNPAID,
        fineItemsCount: 0,
        firstFineIssuedAt: null,
        lastFineIssuedAt: null,
        dueDate: null,
        waivedAmount: null,
        waivedBy: null,
        waivedReason: null,
        waivedAt: null,
        remarks: null,
        reason: '',
        metadata: {
          createdAt: now,
          updatedAt: now,
          isArchived: false,
        },
      };
      batch.set(fineDocRef, fineData);
      newDocs.push(fineData);
    }

    await batch.commit();
    for (const d of newDocs) existingMap.set(d.studentId, d);
  }

  return students.map(s => existingMap.get(s.member.studentId)!).filter(Boolean);
};

// ── Post-commit updates WITHOUT clearance recalculation ───────────────────
// Clearance is now handled separately as its own phase
const postCommitUpdates = async (
  fine: StudentFines,
  amount: number,
  report: (phase: FineGenerationPhase, message: string) => void
) => {
  const count = await updateFineItemCount(fine, 1);

  const results = await Promise.allSettled([
    count === 1
      ? updateFirstFineIssuedAt(fine.id!)
      : updateLastFineIssuedAt(fine.id!),
    recalculateFines(fine.id!, amount),
  ]);

  const failed = results.filter(r => r.status === "rejected");
  if (failed.length > 0) {
    failed.forEach(f =>
      console.error("Post-commit update failed:", (f as PromiseRejectedResult).reason)
    );
    report("error", `Some post-commit updates failed for user ${fine.userId}. See console.`);
  }

  const recalcResult = results[1] as PromiseFulfilledResult<{ success: boolean }>;
  if (recalcResult.status === "fulfilled" && !recalcResult.value.success) {
    report("error", `Failed recalculating fines for ${fine.id}. See console.`);
  }
};

export const generateFinesOnEvent = async (
  event: Event,
  onProgress?: OnFineProgress
): Promise<void> => {
  const counts = {
    absentTotal: 0,
    absentDone: 0,
    partialTotal: 0,
    partialDone: 0,
  };

  const term = await getActiveTerm();

  const report = (
    phase: FineGenerationPhase,
    message: string,
    batch?: { batchNum: number; totalBatches: number }
  ) => onProgress?.(makeSnapshot(phase, counts, message, batch));

  // ── PREFLIGHT ─────────────────────────────────────────────────────────────
  report("preflight", "Fetching fine type and querying absent users…");

  const [type, absentUsers] = await Promise.all([
    getFineTypeById(event.fineTypeId),
    getNonAttendeesForEvent(event.id),
  ]);

  if (!type) {
    report("error", `Fine type ${event.fineTypeId} not found.`);
    console.error(`Fine type with ID ${event.fineTypeId} not found.`);
    return;
  }

  report("preflight", "Fetching fine records and loading issuer profile…");

  const issuer = await getCurrentUserData() as unknown as Member;

  const [absentUsersFines, partialUsers] = await Promise.all([
    absentUsers?.length ? getOrCreateFinesForStudents(absentUsers, term!, issuer, event.orgId!) : Promise.resolve([]),
    type.requiresTimeOut ? getPartialAttendeesForEvent(event.id) : Promise.resolve([]),
  ]);

  console.log(absentUsersFines)

  let partialUsersFines: typeof absentUsersFines = [];
  if (type.requiresTimeOut && partialUsers?.length) {
    report("preflight", "Fetching fine records for partial users…");
    partialUsersFines = await getOrCreateFinesForStudents(partialUsers, term!, issuer, event.orgId);
  }

  if (!absentUsersFines.length && !partialUsersFines.length) {
    report("done", "No users found to generate fines for.");
    console.warn("No users found to generate fines for.");
    return;
  }

  report("preflight", "Loading issuer profile…");
  // issuer already loaded above

  counts.absentTotal = absentUsersFines.length;
  counts.partialTotal = partialUsersFines.length;
  report(
    "preflight",
    `Ready — ${counts.absentTotal} absent, ${counts.partialTotal} partially absent users to process.`
  );

  const batchSize = 20;
  const issuerName = issuer ? `${issuer.firstName} ${issuer.lastName}` : "Unknown Issuer";
  const eventDate = Timestamp.fromDate(new Date(event.date));
  const eventName = event.name ?? "Unknown Event";

  // Collect all processed user IDs for the clearance phase
  const allProcessedFines: typeof absentUsersFines = [];

  // ── SHARED BATCH PROCESSOR — writes + postCommit only, no clearance ───────
  const processUserBatch = async (
    batchSlice: typeof absentUsersFines,
    amount: number,
    reason: string,
  ) => {
    const preparedItems = await Promise.all(
      batchSlice.map(fine => prepareFineItem(fine, issuer))
    );

    const batch = writeBatch(db);

    for (const { fine, itemNumber, fineItemRef, clearanceRef } of preparedItems) {
      batch.set(fineItemRef, {
        itemNumber,
        fineTypeId: type.id,
        fineTypeName: type.name,
        eventId: event.id,
        eventName,
        eventDate,
        amount,
        reason,
        issuedBy: issuerName,
        issuedAt: Timestamp.now(),
        isWaived: false,
        waivedBy: null,
        waivedReason: null,
        waivedAt: null,
        appealNotes: null,
        appealedAt: null,
        appealStatus: null,
        appealResolvedAt: null,
        appealResolvedBy: null,
        metadata: {
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          isArchived: false,
        },
        isPaid: false,
        isArchived: false,
        isPending: false,
        academicYear: fine.academicYear,
        semester: fine.semester, 
      });

      batch.set(
        clearanceRef,
        {
          id: clearanceRef.id,
          userId: fine.userId,
          orgId: fine.orgId,
          studentId: fine.studentId,
          userName: fine.userName,
          status: "not_cleared",
          academicYear: fine.academicYear,
          semester: fine.semester,
          isArchived: false,
          createdAt: Timestamp.now(),
          blockingItems: {
            [fineItemRef.id]: {
              type: PaymentType.FINES,
              referenceId: fineItemRef.id,
              parentFineId: fine.id!,
              title: event.name,
              balance: amount,
              status: "unpaid",
              pendingReview: false,
              isRequiredForClearance: true,
              academicYear: fine.academicYear,
              semester: fine.semester,
            },
          },
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      );
    }

    await batch.commit();

    await Promise.all(
      preparedItems.map(({ fine }) => postCommitUpdates(fine, amount, report))
    );

    // Collect fines for clearance phase later
    allProcessedFines.push(...batchSlice);
  };

  // ── ABSENT USERS ──────────────────────────────────────────────────────────
  if (absentUsersFines.length > 0) {
    const totalBatches = Math.ceil(absentUsersFines.length / batchSize);
    const amount = type.requiresTimeOut
      ? type.defaultAmount * 2
      : type.defaultAmount;

    try {
      for (let i = 0; i < absentUsersFines.length; i += batchSize) {
        const batchNum = Math.floor(i / batchSize) + 1;
        const batchSlice = absentUsersFines.slice(i, i + batchSize);

        await processUserBatch(
          batchSlice,
          amount,
          `Fine for being absent in event ${eventName}`,
        );

        counts.absentDone += batchSlice.length;
        report(
          "absent",
          `Absent batch ${batchNum}/${totalBatches} committed (${counts.absentDone}/${counts.absentTotal})`,
          { batchNum, totalBatches }
        );
      }
    } catch (error) {
      handleFirestoreError(error, `generating fine items for absent attendees in event ${event.id}`);
      report("error", "Failed on absent-user batch. See console for details.");
      return;
    }
  }

  // ── PARTIAL USERS ─────────────────────────────────────────────────────────
  if (partialUsersFines.length > 0) {
    const totalBatches = Math.ceil(partialUsersFines.length / batchSize);
    const amount = type.defaultAmount;

    try {
      for (let i = 0; i < partialUsersFines.length; i += batchSize) {
        const batchNum = Math.floor(i / batchSize) + 1;
        const batchSlice = partialUsersFines.slice(i, i + batchSize);

        await processUserBatch(
          batchSlice,
          amount,
          `Fine for being partially absent in event ${eventName}`,
        );

        counts.partialDone += batchSlice.length;
        report(
          "partial",
          `Partial batch ${batchNum}/${totalBatches} committed (${counts.partialDone}/${counts.partialTotal})`,
          { batchNum, totalBatches }
        );
      }
    } catch (error) {
      handleFirestoreError(error, `generating fine items for partial attendees in event ${event.id}`);
      report("error", "Failed on partial-user batch. See console for details.");
      return;
    }
  }

  await disableFineGeneration(event.id);

  const toAdd = counts.absentTotal * (type.requiresTimeOut ? type.defaultAmount * 2 : type.defaultAmount) + counts.partialTotal * type.defaultAmount;
  await updateFineStats(`${term!.AY}-${term!.semester}-${allProcessedFines[0].orgId}`, toAdd, 0);

  // ── CLEARANCE PHASE — runs only after ALL writes are done ─────────────────
  const clearanceTotal = allProcessedFines.length;
  let clearanceDone = 0
  const clearanceChunkSize = 20;

  report("clearance", `Recalculating clearance for ${clearanceTotal} users… (0/${clearanceTotal})`);

  for (let i = 0; i < allProcessedFines.length; i += clearanceChunkSize) {
    const chunk = allProcessedFines.slice(i, i + clearanceChunkSize);

    await Promise.allSettled(
      chunk.map(fine =>
        withTimeout(
          recalculateClearanceStatus(fine.userId),
          10_000,
          `recalculateClearanceStatus(${fine.userId})`
        )
      )
    );

    clearanceDone += chunk.length;
    report("clearance", `Recalculating clearance… (${clearanceDone}/${clearanceTotal})`);
  }

  // ── DONE ──────────────────────────────────────────────────────────────────
  const grandTotal = counts.absentDone + counts.partialDone;
  report("done", `All ${grandTotal.toLocaleString()} fine items written successfully.`);
};


/**
 * Safely converts any date-like value to a Firestore Timestamp.
 * Uses duck-typing (.toDate) instead of instanceof to avoid SDK version mismatch bugs.
 */
const toTimestamp = (val: any, fallback: Timestamp): Timestamp => {
    if (!val) return fallback;
    // Firestore Timestamp — has .toDate()
    if (typeof val.toDate === "function") {
        try {
            const d: Date = val.toDate();
            if (d instanceof Date && !isNaN(d.getTime())) {
                return Timestamp.fromDate(d);
            }
        } catch {
            return fallback;
        }
    }
    // Plain JS Date
    if (val instanceof Date && !isNaN(val.getTime())) {
        return Timestamp.fromDate(val);
    }
    // ISO string
    if (typeof val === "string") {
        const d = new Date(val);
        if (!isNaN(d.getTime())) return Timestamp.fromDate(d);
    }
    return fallback;
};

/**
 * For a newly added student, iterate over all events where fine generation
 * has already been run (fineGenerationDone == true). Mark them as absent
 * and create fineItem documents under their fine record — exactly mirroring
 * what generateFinesOnEvent does for bulk absent users.
 *
 * Call this AFTER createFinePerStudent() so the parent fine doc exists.
 */
export const assignExistingFinesToStudent = async (
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
    const userName = `${studentData.firstName} ${studentData.lastName}`;
    const termData = await getActiveTerm();
 
  const issuer = currentUser;
    const issuerName = issuer
        ? `${issuer.firstName} ${issuer.lastName}`
        : "Unknown Issuer";
 
    const eventsRef = collection(db, "events");
    const eventsQuery = query(
        eventsRef,
      where("finesGenerated", "==", true), 
      where("isDeleted", "==", false),
      where("orgId", "==", orgId),
      where("academicYear", "==", termData!.AY),
      where("semester", "==", termData!.semester),
    );
    const eventsSnap = await getDocs(eventsQuery);
 
    if (eventsSnap.empty) return; 

    const finesRef = collection(db, "fines");
    const fineQuery = query(
        finesRef,
      and(
          where("userId", "==", userId),
          where("orgId", "==", orgId),
          where("academicYear", "==", termData!.AY),
        or(
          where("semester", "==", termData!.semester),
          where("semester", "==", `${termData!.semester} Semester`)
          )
        )
    );
    let fineSnap = await getDocs(fineQuery);
 
    if (fineSnap.empty) {
        // create fines here
        const student = await getUserById(userId);
        if (student) {
            const studentData = {
                id: student?.id!,
                member: student!
            }
            await getOrCreateFinesForStudents([studentData], {AY: termData!.AY, semester: termData!.semester }, currentUser, orgId)
        }

        fineSnap = await getDocs(fineQuery);

    }
 
    const fineDoc = fineSnap.docs[0]; 
    const fineDocRef = fineDoc.ref;
    const parentFineId = fineDoc.id;
    const term = await getActiveTerm();
    const clearanceId = buildClearanceId(userId, orgId, orgContext.accessLevel, term!);
    const clearanceRef = doc(db, "clearanceStatus", clearanceId);
    const fineItemsCollection = collection(db, "fines", parentFineId, "fineItems")
    const now = Timestamp.now();
 
    const eventDocs = eventsSnap.docs;
    const CHUNK_SIZE = 20;
 
    let totalFineAmount = 0;
    let itemNumberOffset = 0; 

    const currentFineData = fineDoc.data();
    let nextItemNumber = (currentFineData.fineItemsCount ?? 0) + 1;
 
    for (let i = 0; i < eventDocs.length; i += CHUNK_SIZE) {
        const chunk = eventDocs.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
 
        const blockingItems: Record<string, object> = {};
        let chunkTotalAmount = 0;
        let chunkItemCount = 0;
 
        for (const eventDoc of chunk) {
            const event = eventDoc.data();
 
            const fineType = await getFineTypeById(event.fineTypeId);
            if (!fineType) {
                console.warn(`Fine type ${event.fineTypeId} not found for event ${eventDoc.id}, skipping.`);
                continue;
            }

            const amount = fineType.requiresTimeOut
                ? fineType.defaultAmount * 2
                : fineType.defaultAmount;
 
            const eventDate = toTimestamp(event.date, now);
            const eventName: string = event.name ?? "Unknown Event";
 
            const fineItemRef = doc(fineItemsCollection);
 
            batch.set(fineItemRef, {
                itemNumber: nextItemNumber,
                fineTypeId: fineType.id,
                fineTypeName: fineType.name,
                eventId: eventDoc.id,
                eventName,
                eventDate,
                amount,
                reason: `Fine for being absent in event ${eventName}`,
                issuedBy: issuerName,
                issuedAt: now,
                isWaived: false,
                waivedBy: null,
                waivedReason: null,
                waivedAt: null,
                appealNotes: null,
                appealedAt: null,
                appealStatus: null,
                appealResolvedAt: null,
                appealResolvedBy: null,
                metadata: {
                    createdAt: now,
                    updatedAt: now,
                    isArchived: false,
                },
                isPaid: false,
                isArchived: false,
                isPending: false,
                academicYear: term!.AY,
                semester: term!.semester,
                parentFineId,
                userId,
                studentId: studentData.studentId,
                userName,
                orgId,
            });
 
            blockingItems[fineItemRef.id] = {
                type: PaymentType.FINES,
                referenceId: fineItemRef.id,
                parentFineId,
                title: eventName,
                balance: amount,
                status: "unpaid",
                pendingReview: false,
                isRequiredForClearance: true,
            };
 
            chunkTotalAmount += amount;
            chunkItemCount++;
            nextItemNumber++;
        }
 
        if (chunkItemCount === 0) continue; 
 
        batch.update(fineDocRef, {
            accumulatedAmount: increment(chunkTotalAmount),
            balance: increment(chunkTotalAmount),
            fineItemsCount: increment(chunkItemCount),
            lastFineIssuedAt: now,
            "metadata.updatedAt": now,
        });
 
        batch.set(
            clearanceRef,
            {
                blockingItems,
                updatedAt: now,
            },
            { merge: true }
        );
 
        await batch.commit();
 
        totalFineAmount += chunkTotalAmount;
    }
 
    if (totalFineAmount > 0) {
        try {
            await runTransaction(db, async (transaction) => {
                const latestFineDoc = await transaction.get(fineDocRef);
                if (!latestFineDoc.exists()) return;
                const data = latestFineDoc.data();
                if (!data.firstFineIssuedAt) {
                    transaction.update(fineDocRef, { firstFineIssuedAt: now });
                }
            });
        } catch (e) {
            console.warn("Could not set firstFineIssuedAt:", e);
        }
    }
 
    if (totalFineAmount > 0) {
        await updateFineStats(`${term!.AY}-${term!.semester}-${orgId}`, totalFineAmount, 0);
        await recalculateClearanceStatus(userId, term);
    }
};
