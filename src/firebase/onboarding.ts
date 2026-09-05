import { Organization, Term } from "@/constants/types";
import { Member } from "@/features/organization/members/types";
import { ClearanceStatus } from "@/features/organization/clearance/types";
import { buildClearanceId } from "@/firebase/clearance";
import { updateStudentStats } from "@/firebase/stats/update/updateStats";
import { getActiveTerm } from "@/firebase/term";
import { assignExistingFeesToStudent } from "@/firebase/fees";
import { assignExistingFinesToStudent } from "@/firebase/fines/create/fines";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase.config";

/**
 * Centralized student onboarding helper.
 *
 * For a newly added student, iterates all subscribed organizations and:
 *  1. Creates a clearance document for each matching org.
 *  2. Increments that org's student count stats.
 *  3. Backfills past fees  (`assignExistingFeesToStudent`).
 *  4. Backfills past fines (`assignExistingFinesToStudent`).
 *     Note: `assignExistingFinesToStudent` internally creates the parent fine
 *     doc via `getOrCreateFinesForStudents` if one doesn't exist, so a
 *     separate `createFinePerStudent` call is NOT required.
 *
 * `allOrgs` MUST be fetched by the caller before invoking this function —
 * never fetched internally — to avoid N redundant Firestore reads when
 * onboarding students in bulk (e.g. CSV import).
 *
 * Org-matching logic (mirrors Self-Registration approval, with precedence fix):
 *   org.subscribed is true AND one of:
 *     - org.programId  === student.programId   (Level 1 org scope)
 *     - org.facultyId  === student.facultyId   (Level 2 org scope)
 *     - org has neither programId nor facultyId (Level 3 / university-wide)
 */
export const onboardNewStudent = async (
  userId: string,
  studentData: Member,
  allOrgs: Organization[],
  currentUser: Member
): Promise<void> => {
  const term = await getActiveTerm();
  if (!term) {
    console.error("[onboardNewStudent] No active term found — aborting.");
    return;
  }

  const now = Timestamp.now();
  // Default clearance due date — adjust per org policy if needed in the future.
  const defaultDueDate = Timestamp.fromDate(new Date("2026-12-30"));

  for (const org of allOrgs) {
    // Strict matching based on access level to prevent `undefined === undefined` matches
    const matches = org.subscribed && (
      (org.accessLevel === 1 && org.programId && org.programId === studentData.programId) ||
      (org.accessLevel === 2 && org.facultyId && org.facultyId === studentData.facultyId) ||
      (org.accessLevel === 3)
    );

    if (!matches) continue;

    // ── 1. Clearance document ───────────────────────────────────────────────
    const clearanceId = buildClearanceId(
      userId,
      org.id!,
      org.accessLevel!,
      term as Term
    );
    const clearanceRef = doc(db, "clearanceStatus", clearanceId);

    const clearanceData: ClearanceStatus = {
      id: clearanceId,
      orgId: org.id!,
      userId,
      userName: `${studentData.firstName} ${studentData.lastName}`,
      studentId: studentData.studentId || "N/A",
      academicYear: term.AY,
      semester: term.semester,
      status: "cleared",         // blockingItems populated by fee/fine backfill below
      visibility: "public",
      blockingItems: {},
      clearanceDate: null,
      lastCalculatedAt: now,
      startDate: now,
      dueDate: defaultDueDate,
      createdAt: now,
      updatedAt: now,
      isArchived: false,
    };

    await setDoc(clearanceRef, clearanceData);

    // ── 2. Student count stats ──────────────────────────────────────────────
    await updateStudentStats(`${term.AY}-${term.semester}-${org.id!}`, 1);

    const studentInfo = {
      firstName: studentData.firstName,
      lastName: studentData.lastName,
      studentId: studentData.studentId,
    };
    const orgContext = { uid: org.id!, accessLevel: org.accessLevel! };

    // ── 3. Backfill past fees ───────────────────────────────────────────────
    await assignExistingFeesToStudent(userId, studentInfo, orgContext, currentUser);

    // ── 4. Backfill past fines ──────────────────────────────────────────────
    await assignExistingFinesToStudent(userId, studentInfo, orgContext, currentUser);
  }
};
