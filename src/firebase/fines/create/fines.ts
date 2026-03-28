import { db } from "@/firebase/firebase.config";
import { getAllUsers, getCurrentUserData } from "@/firebase/users";
import { collection, addDoc, writeBatch, doc, CollectionReference, DocumentData, Timestamp, getCountFromServer, setDoc } from "firebase/firestore";
import { getFineTypeById } from "../read/fineType";
import { Member } from "@/features/organization/members/types";
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
import { recalculateClearanceStatus } from "@/firebase/clearance";
import { cacheService, CACHE_KEYS } from "@/services/cacheService";
import { getAllFines, getAllUnpaidFinesforOrg } from "../read/fines";


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

  export const createFinePerStudent = async (userId: string, user: Member, AY?: string, sem?:string) => {
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
      const fineData = {
        orgId: currentUser.uid,
        userId: userId,
        studentId: user.studentId,
        userName: `${user?user.firstName:"Unknown"} ${user?user.lastName : ""}`,
        academicYear: AY? AY : "2025-2026",
        semester: sem? sem : "2nd Semester", //AY and SEM should have dedicated way of being determined in the future, for now it's hardcoded
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
        const orgId = currentUser.uid || '';
        cacheService.invalidate(CACHE_KEYS.clearanceDoc(userId));
        cacheService.invalidate(CACHE_KEYS.finesAll(orgId));
        cacheService.invalidate(CACHE_KEYS.finesUnpaid(orgId));
        
        getAllFines().catch(console.error);
        getAllUnpaidFinesforOrg().catch(console.error);
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
    const currentUser = await getCurrentUserData();
    if (!currentUser) {
      report("error", "No authenticated user found.");
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
          orgId:      currentUser.uid,
          userId:     user.id,
          userName:   `${user.member.firstName} ${user.member.lastName}`,
          studentId:  user.member.studentId,
          academicYear: "2025-2026", 
          semester:     "2nd Semester",
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

    const orgId = currentUser.uid || '';
    cacheService.invalidate(CACHE_KEYS.finesAll(orgId));
    cacheService.invalidate(CACHE_KEYS.finesUnpaid(orgId));
    cacheService.invalidate(CACHE_KEYS.clearanceAll(orgId));
    
    getAllFines().catch(console.error);
    getAllUnpaidFinesforOrg().catch(console.error);

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

const prepareFineItem = async (fine: StudentFines) => {
  const subColRef = collection(db, "fines", fine.id!, "fineItems");
  const countSnapshot = await getCountFromServer(subColRef);
  const itemNumber = (countSnapshot.data().count ?? 0) + 1;
  const fineItemRef = doc(subColRef);
  const clearanceRef = doc(db, "clearanceStatus", fine.userId);
  return { fine, itemNumber, fineItemRef, clearanceRef };
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

  report("preflight", "Fetching fine records…");

  const [absentUsersFines, /*partialUsers*/] = await Promise.all([
    absentUsers?.length ? getFinesByStudents(absentUsers) : Promise.resolve([]),
    // type.requiresTimeOut ? getPartialAttendeesForEvent(event.id) : Promise.resolve([]),
  ]);

  let partialUsersFines: typeof absentUsersFines = [];
  // if (type.requiresTimeOut && partialUsers?.length) {
  //   report("preflight", "Fetching fine records for partial users…");
  //   partialUsersFines = await getFinesByStudents(partialUsers);
  // }

  if (!absentUsersFines.length && !partialUsersFines.length) {
    report("done", "No users found to generate fines for.");
    console.warn("No users found to generate fines for.");
    return;
  }

  report("preflight", "Loading issuer profile…");
  const issuer = await getCurrentUserData() as unknown as Member;

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
      batchSlice.map(fine => prepareFineItem(fine))
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
        },
        isPaid: false,
        isArchived: false,
        isPending: false,
      });

      batch.set(
        clearanceRef,
        {
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