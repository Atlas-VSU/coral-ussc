import {
  collection,
  doc,
  getDocs,
  query,
  QueryDocumentSnapshot,
  Timestamp,
  where,
  writeBatch,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/firebase/firebase.config";
import { Member } from "@/features/organization/members/types";
import { getActiveTerm } from "@/firebase/term";

/**
 * Where each collection keeps its archive flag. These are NOT uniform — fees
 * and clearance use a top-level `isArchived`, fines use `metadata.isArchived`.
 * Writing the wrong path leaves the record invisible, so the mapping is
 * declared once here rather than inlined per call.
 */
const ARCHIVE_FIELD: Record<string, string> = {
  fees: "isArchived",
  fines: "metadata.isArchived",
  clearanceStatus: "isArchived",
};

/** Marker written by the roster sync when it archives a retired student's
 *  records. Only records bearing it are un-archived, so a fee an officer
 *  archived deliberately is never silently reinstated. */
const ROSTER_SYNC_ARCHIVE_PREFIX = "roster-sync";

export interface RestoreResult {
  userRestored: boolean;
  feesRestored: number;
  finesRestored: number;
  clearanceRestored: number;
  /** Records left archived because something other than the roster sync
   *  archived them — reported so the operator can review, never reversed. */
  skippedForeignArchives: number;
}

/** Reads a possibly-nested boolean (e.g. "metadata.isArchived") off a document. */
function readFlag(data: DocumentData, path: string): boolean {
  return path
    .split(".")
    .reduce<unknown>((value, key) => (value as Record<string, unknown> | undefined)?.[key], data) === true;
}

/** Reads the archive reason, wherever the collection keeps it. */
function readArchiveReason(data: DocumentData): string {
  return String(data.archivedReason ?? data.metadata?.archivedReason ?? "");
}

/**
 * Restores a student the roster sync had retired, together with the term
 * records it archived alongside them.
 *
 * THIS IS NOT ONBOARDING — and must never be followed by `onboardNewStudent`.
 * Onboarding backfills a fresh set of fees and fines; running it over a
 * restored student stacks a second set on top of the ones being reinstated and
 * double-charges them. Restore reinstates what already existed; onboarding
 * creates what never did. They are opposites.
 *
 * Scope mirrors the sync that archived them: the ACTIVE TERM only, matched on
 * `studentId`, and limited to records the sync itself archived. Records from
 * previous semesters were never archived and are never touched here.
 *
 * @param docId    the soft-deleted user document to bring back
 * @param studentId the student's ID, used to find their archived term records
 * @param updates  roster fields to refresh on the way back in — a returning
 *                 student may have shifted program since they were retired
 */
export const restoreStudentRecord = async (
  docId: string,
  studentId: string,
  updates: Partial<Member> = {}
): Promise<RestoreResult> => {
  const term = await getActiveTerm();
  if (!term) {
    throw new Error("Cannot restore a student record without an active term.");
  }

  const now = Timestamp.now();
  const result: RestoreResult = {
    userRestored: false,
    feesRestored: 0,
    finesRestored: 0,
    clearanceRestored: 0,
    skippedForeignArchives: 0,
  };

  // ── Find the records the sync archived for this student, this term ─────────
  const collections = ["fees", "fines", "clearanceStatus"] as const;
  const toRestore: Record<string, QueryDocumentSnapshot<DocumentData>[]> = {
    fees: [],
    fines: [],
    clearanceStatus: [],
  };

  for (const collectionName of collections) {
    const snapshot = await getDocs(
      query(
        collection(db, collectionName),
        where("studentId", "==", studentId),
        where("academicYear", "==", term.AY),
        where("semester", "==", term.semester)
      )
    );

    const archiveField = ARCHIVE_FIELD[collectionName];
    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      if (!readFlag(data, archiveField)) return; // already visible — nothing to do

      if (!readArchiveReason(data).startsWith(ROSTER_SYNC_ARCHIVE_PREFIX)) {
        result.skippedForeignArchives++;
        return;
      }
      toRestore[collectionName].push(docSnap);
    });
  }

  // ── Write ──────────────────────────────────────────────────────────────────
  const batch = writeBatch(db);

  // Firestore rejects `undefined` outright, and several Member fields are
  // optional (`facultyId`, `yearLevel`), so a form that left one blank would
  // otherwise fail the whole restore. Absent fields mean "leave as they are",
  // which is also the behaviour a caller expects from a partial update.
  const definedUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined)
  );

  batch.update(doc(db, "users", docId), {
    ...definedUpdates,
    isDeleted: false,
    restoredAt: now,
    updatedAt: now,
  });
  result.userRestored = true;

  for (const collectionName of collections) {
    const archiveField = ARCHIVE_FIELD[collectionName];
    const isNested = archiveField.startsWith("metadata.");

    for (const docSnap of toRestore[collectionName]) {
      const update: Record<string, unknown> = {
        [archiveField]: false,
        archivedAt: null,
        archivedReason: null,
        restoredAt: now,
      };
      if (isNested) update["metadata.updatedAt"] = now;
      else update.updatedAt = now;

      batch.update(docSnap.ref, update);
    }
  }

  await batch.commit();

  result.feesRestored = toRestore.fees.length;
  result.finesRestored = toRestore.fines.length;
  result.clearanceRestored = toRestore.clearanceStatus.length;

  return result;
};
