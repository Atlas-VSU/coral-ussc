import { db } from "@/firebase/firebase.config";
import { getAllUsers, getCurrentUserData } from "@/firebase/users";
import { collection, addDoc, writeBatch, doc, CollectionReference, DocumentData, Timestamp, getCountFromServer } from "firebase/firestore";
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

        batch.set(doc(finesCollection), fineData);
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

