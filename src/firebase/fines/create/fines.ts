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
import { BulkFinesProgress, BulkFinesResult, FineGenerationPhase, FineGenerationProgress, OnFineProgress } from "@/features/organization/fines/types";
import { Event } from "@/features/organization/events/types";
import { updateFirstFineIssuedAt, updateLastFineIssuedAt } from "../update/fines";


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
      console.log("Fine document created with ID: ", docRef.id);

      // Initialize student's clearance document for this fine
      const clearanceRef = doc(db, 'clearanceStatus', userId);
      await setDoc(clearanceRef, {
          blockingItems: {
              [docRef.id]: {
                  type: 'fine',
                  referenceId: docRef.id,
                  title: 'Fines',
                  balance: 0,
                  status: "paid",
                  paymentHistory: [],
                  pendingReview: false,
                  isRequiredForClearance: true
              }
          },
          updatedAt: Timestamp.now()
      }, { merge: true });
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
          academicYear: "2024-2025", 
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

        // Initialize clearance for this student
        const clearanceRef = doc(db, 'clearanceStatus', user.id!);
        batch.set(clearanceRef, {
            blockingItems: {
                [fineDocRef.id]: {
                    type: 'fine',
                    referenceId: fineDocRef.id,
                    title: 'Fines',
                    balance: 0,
                    status: "paid",
                    paymentHistory: [],
                    pendingReview: false,
                    isRequiredForClearance: true
                }
            },
            updatedAt: Timestamp.now()
        }, { merge: true });
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
    }

    result.success = true;
    report("done", `All ${result.committed} fine documents created successfully.`);
    return result;

  } catch (error) {
    handleFirestoreError(error, "creating fines documents in bulk");
    report("error", "Unexpected error during bulk fine creation.");
    return result;
  }
};



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

export const generateFinesOnEvent = async (
  event: Event,
  onProgress?: OnFineProgress       
): Promise<void> => {

  // Running totals — updated in-place so every onProgress call is up-to-date
  const counts = {
    absentTotal: 0,
    absentDone: 0,
    partialTotal: 0,
    partialDone: 0,
  };

  // Shorthand so call sites stay readable
  const report = (
    phase: FineGenerationPhase,
    message: string,
    batch?: { batchNum: number; totalBatches: number }
  ) => onProgress?.(makeSnapshot(phase, counts, message, batch));



  report("preflight", "Fetching fine type…");
  const type = await getFineTypeById(event.fineTypeId);
  console.log("Fetched fine type:", type);
  if (!type) {
    report("error", `Fine type ${event.fineTypeId} not found.`);
    console.error(`Fine type with ID ${event.fineTypeId} not found.`);
    return;
  }

  report("preflight", "Querying absent users…");
  const absentUsers = await getNonAttendeesForEvent(event.id);

  report("preflight", "Fetching fine records for absent users…");
  const absentUsersFines = absentUsers?.length
    ? await getFinesByStudents(absentUsers)
    : [];

  let partialUsersFines: typeof absentUsersFines = [];

  if (type.requiresTimeOut) {
    report("preflight", "Querying partial attendees…");
    const partialUsers = await getPartialAttendeesForEvent(event.id);

    if (partialUsers?.length) {
      report("preflight", "Fetching fine records for partial users…");
      partialUsersFines = await getFinesByStudents(partialUsers);
    }
  }

  if (!absentUsersFines.length && !partialUsersFines.length) {
    report("done", "No users found to generate fines for.");
    console.warn("No users found to generate fines for.");
    return;
  }

  report("preflight", "Loading issuer profile…");
  const issuer = await getCurrentUserData() as unknown as Member;

  counts.absentTotal  = absentUsersFines.length;
  counts.partialTotal = partialUsersFines.length;
  report("preflight",
    `Ready — ${counts.absentTotal} absent, ${counts.partialTotal} partially absent users to process.`
  );

  const batchSize = 20;


  // ──  ABSENT USERS ────────────────────────────────────────────────────────

  if (absentUsersFines.length > 0) {
    const totalBatches = Math.ceil(absentUsersFines.length / batchSize);
    const amount = type.requiresTimeOut
      ? type.defaultAmount * 2
      : type.defaultAmount;

    try {
      for (let i = 0; i < absentUsersFines.length; i += batchSize) {
        const batchNum = Math.floor(i / batchSize) + 1;
        const batchSlice = absentUsersFines.slice(i, i + batchSize);
        const batch = writeBatch(db);

        for (const fine of batchSlice) {
          const subColRef = collection(db, "fines", fine.id!, "fineItems");
          const countSnapshot = await getCountFromServer(subColRef);
          const itemNumber = (countSnapshot.data().count ?? 0) + 1;

          const fineItem = {
            itemNumber,
            fineTypeId: type.id,
            fineTypeName: type.name,
            eventId: event.id,
            eventName: event.name  ?? "Unknown Event",
            eventDate: event.date  ?? null,
            amount,
            reason: `Fine for being absent in event ${event.name ?? "."}`,
            issuedBy: issuer ? `${issuer.firstName} ${issuer.lastName}` : "Unknown Issuer",
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
            isPaid:     false,
            isArchived: false,
          };

          batch.set(doc(subColRef), fineItem);

          const count = await updateFineItemCount(fine, 1);
          if (count === 1) {
            await updateFirstFineIssuedAt(fine.id!);
          } else {
            await updateLastFineIssuedAt(fine.id!);
          }
          const calculationResult = await recalculateFines(fine.id!, amount);
          if (!calculationResult.success) {
            report("error", `Failed recalculating fines. See console for details.`);
            return;
          }

          // Update student's clearance document
          const clearanceRef = doc(db, 'clearanceStatus', fine.userId);
          batch.set(clearanceRef, {
            blockingItems: {
              [fine.id!]: {
                type: 'fine',
                referenceId: fine.id!,
                title: 'Fines',
                balance: calculationResult.balance,
                status: calculationResult.status === "paid" ? "paid" : "unpaid",
                paymentHistory: [],
                pendingReview: calculationResult.status === "pending",
                isRequiredForClearance: true
              }
            },
            updatedAt: Timestamp.now()
          }, { merge: true });
        }

        await batch.commit();

        // Update the running counter AFTER the commit succeeds
        counts.absentDone += batchSlice.length;

        report(
          "absent",
          `Absent batch ${batchNum}/${totalBatches} committed (${counts.absentDone}/${counts.absentTotal})`,
          { batchNum, totalBatches }
        );
      }
    } catch (error) {
      handleFirestoreError(error, `generating fine items for absent attendees in event ${event.id}`);
      report("error", `Failed on absent-user batch. See console for details.`);
      return;
    }
  }


  // ── PARTIAL USERS ───────────────────────────────────────────────────────

  if (partialUsersFines.length > 0) {
    const totalBatches = Math.ceil(partialUsersFines.length / batchSize);
    const amount = type.defaultAmount;   // partial = standard rate (no ×2)

    try {
      for (let i = 0; i < partialUsersFines.length; i += batchSize) {
        const batchNum   = Math.floor(i / batchSize) + 1;
        const batchSlice = partialUsersFines.slice(i, i + batchSize);
        const batch      = writeBatch(db);

        for (const fine of batchSlice) {           // ← for...of, not forEach
          const subColRef     = collection(db, "fines", fine.id!, "fineItems");
          const countSnapshot = await getCountFromServer(subColRef);
          const itemNumber    = (countSnapshot.data().count ?? 0) + 1;

          const fineItem = {
            itemNumber,
            fineTypeId: type.id,
            fineTypeName: type.name,
            eventId: event.id,
            eventName: event.name ?? "Unknown Event",
            eventDate: event.date ?? null,
            amount,
            reason: `Fine for being partially absent in event ${event.name ?? "."}`,
            issuedBy: issuer ? `${issuer.firstName} ${issuer.lastName}` : "Unknown Issuer",
            issuedAt: Timestamp.now(),
            isWaived: false,
            waivedBy: null,
            waivedReason: null,
            waivedAt: null,
            appealNotes:  null,
            appealedAt:  null,
            appealStatus: null,
            appealResolvedAt: null,
            appealResolvedBy: null,
            metadata: {
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            },
            isPaid:     false,
            isArchived: false,
          };

          batch.set(doc(subColRef), fineItem);

          await updateFineItemCount(fine, 1);
          const calculationResult = await recalculateFines(fine.id!, amount);
          if (!calculationResult.success) {
            report("error", `Failed recalculating fines. See console for details.`);
            return;
          }

          // Update student's clearance document
          const clearanceRef = doc(db, 'clearanceStatus', fine.userId);
          batch.set(clearanceRef, {
            blockingItems: {
              [fine.id!]: {
                type: 'fine',
                referenceId: fine.id!,
                title: 'Fines',
                balance: calculationResult.balance,
                status: calculationResult.status === "paid" ? "paid" : "unpaid",
                paymentHistory: [],
                pendingReview: calculationResult.status === "pending",
                isRequiredForClearance: true
              }
            },
            updatedAt: Timestamp.now()
          }, { merge: true });
        }

        await batch.commit();
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
  // ── DONE ────────────────────────────────────────────────────────────────

  const grandTotal = counts.absentDone + counts.partialDone;
  report("done", `All ${grandTotal.toLocaleString()} fine items written successfully.`);
};
