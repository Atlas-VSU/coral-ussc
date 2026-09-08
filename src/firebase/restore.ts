import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  QueryDocumentSnapshot,
  Timestamp,
  where,
  writeBatch,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/firebase/firebase.config";
import { Member, Program } from "@/features/organization/members/types";
import { getActiveTerm } from "@/firebase/term";
import { getProgramById } from "@/firebase/programs";

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

/**
 * The only fields a restore may refresh on the way back in.
 *
 * Everything else on the archived document survives untouched, because a
 * restore is not an edit. `email` and `status` are the pointed omissions: a
 * student who self-registered holds an address they verified themselves, and
 * overwriting it with one an admin typed into the add form sends their login
 * and update links to a mailbox they may never read. The super-admin roster
 * sync refuses the same two fields on its update path, for the same reason.
 *
 * `facultyId` is absent deliberately too — it is derived from `programId`
 * below rather than accepted from the caller, so it can never contradict the
 * program written beside it.
 */
const RESTORABLE_FIELDS: readonly (keyof Member)[] = [
  "firstName",
  "lastName",
  "yearLevel",
  "programId",
];

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
 *                 student may have shifted program since they were retired.
 *                 Filtered against `RESTORABLE_FIELDS`, so anything else the
 *                 caller passes (an email, a status) is ignored rather than
 *                 written; `facultyId` is derived from `programId`.
 * @throws if the record is gone, there is no active term, or its email now
 *         belongs to an active student
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

  const archivedSnap = await getDoc(doc(db, "users", docId));
  if (!archivedSnap.exists()) {
    throw new Error("The record to restore no longer exists.");
  }
  const archivedMember = archivedSnap.data() as Member;

  // The add forms branch to restore BEFORE their own email check runs, and the
  // archived record's address was never reserved while it was retired —
  // `checkEmailExist` filters on `isDeleted == false`, so a live student may
  // have taken it in the meantime. Restoring on top of that would leave two
  // live records sharing an address, and the portal resolves its registration
  // and update links with `.limit(1)` and no ordering: which of the two a link
  // reaches would be arbitrary. Refuse instead.
  if (archivedMember.email) {
    const emailHolders = await getDocs(
      query(
        collection(db, "users"),
        where("email", "==", archivedMember.email),
        where("isDeleted", "==", false)
      )
    );
    const conflict = emailHolders.docs.find((d) => d.id !== docId);
    if (conflict) {
      const holder = conflict.data() as Member;
      throw new Error(
        `Cannot restore this record: its email (${archivedMember.email}) now ` +
        `belongs to an active student (${holder.firstName} ${holder.lastName}, ` +
        `${holder.studentId}). Resolve the duplicate address first.`
      );
    }
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

  // Only whitelisted fields survive, so a caller passing a whole form object
  // cannot quietly overwrite the student's verified email, role or status.
  // Firestore also rejects `undefined` outright and several Member fields are
  // optional (`yearLevel`), so blanks are dropped rather than written: absent
  // means "leave as it is", which is what a partial update should do.
  const definedUpdates = Object.fromEntries(
    Object.entries(updates).filter(
      ([key, value]) =>
        value !== undefined && RESTORABLE_FIELDS.includes(key as keyof Member)
    )
  );

  // Faculty follows the program rather than the caller. Passing it in let the
  // adding admin's own facultyId land on the student, which contradicts the
  // programId written beside it whenever the two belong to different faculties.
  const movingProgram =
    typeof definedUpdates.programId === "string" &&
    definedUpdates.programId !== archivedMember.programId;

  if (movingProgram) {
    const program = await getProgramById(definedUpdates.programId as string);
    const facultyId = (program as Program | null)?.facultyId;
    if (facultyId) definedUpdates.facultyId = facultyId;
  }

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

/**
 * Restores the record an onboarding attempt turned out to collide with.
 *
 * This is the entry point every "I tried to add a student and they were
 * archived" flow must use — Members, Log Attendance, and anything added later.
 * `restoreStudentRecord` takes a free-form `Partial<Member>`, which let each
 * surface decide for itself what a restore carries; the Log Attendance path
 * sent the acting admin's `facultyId` while Members sent the student's, and
 * both sent an `email` that had no business being written. Deciding that here,
 * once, from the record the operator was trying to create, is what keeps the
 * two surfaces from drifting apart again.
 */
export const restoreArchivedStudent = async (
  docId: string,
  student: Member
): Promise<RestoreResult> =>
  restoreStudentRecord(docId, student.studentId, {
    firstName: student.firstName,
    lastName: student.lastName,
    programId: student.programId,
    yearLevel: student.yearLevel,
  });

/**
 * The single wording every surface uses to report a restore.
 *
 * `warning` is non-null when records were left archived because something
 * other than the roster sync archived them. It is not an error — the restore
 * succeeded — but the student is only partly visible again, and an operator
 * who is not told will read the success message as "everything is back".
 */
export const describeRestoreResult = (
  result: RestoreResult
): { summary: string; warning: string | null } => ({
  summary:
    `Record restored — ${result.feesRestored} fee(s), ${result.finesRestored} fine(s) ` +
    `and ${result.clearanceRestored} clearance record(s) brought back.`,
  warning:
    result.skippedForeignArchives > 0
      ? `${result.skippedForeignArchives} record(s) stayed archived because they were ` +
        `archived manually, not by a roster sync. Review them if they should be visible.`
      : null,
});
