import { ClearanceStatus } from "@/features/organization/clearance/types";
import { PaymentType } from "@/constants/types";
import { collection, query, where, documentId, getDocs, DocumentData } from "firebase/firestore";
import { db } from "@/firebase/firebase.config";
import { batchGetPrograms } from "@/firebase/programBatch";
import { getFaculties } from "@/firebase/faculties";
import { Program, Faculty } from "@/features/organization/members/types";

/** Wraps a cell value in double quotes, escaping any existing quotes. */
function csvCell(value: string | number | boolean): string {
  const str = String(value ?? "").replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Batch-fetches documents from `collectionName` by their IDs (chunked to 30 per query).
 * Returns a map of id → document data.
 */
async function batchFetchByIds(
  collectionName: string,
  ids: string[]
): Promise<Map<string, DocumentData>> {
  const result = new Map<string, DocumentData>();
  if (ids.length === 0) return result;

  const CHUNK = 30;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    try {
      const snap = await getDocs(
        query(collection(db, collectionName), where(documentId(), "in", chunk))
      );
      snap.docs.forEach((d) => result.set(d.id, d.data()));
    } catch (err) {
      console.error(`Error fetching ${collectionName} for export:`, err);
    }
  }
  return result;
}

/**
 * Converts an array of ClearanceStatus records to a RFC 4180-compliant CSV string
 * with refined formatting and requested columns:
 *   STUDENT ID | NAME | PROGRAM | FACULTY | MEM. FEE | FINE | STATUS
 *
 * MEM. FEE: total original fee amount charged to the student (always > 0 if fees exist),
 *   regardless of whether the student has already paid.
 * FINE: total fine amount charged (0 if no fines assigned).
 *
 * Amounts are sourced from the actual `fees`/`fineItems` Firestore documents, which
 * always retain the original `amount` field even after `balance` is zeroed out on payment.
 *
 * Triggers a browser download.
 */
export async function exportClearanceToCSV(
  records: ClearanceStatus[],
  filename = "clearance-export.csv"
): Promise<void> {
  const headers = [
    "STUDENT ID",
    "NAME",
    "PROGRAM",
    "FACULTY",
    "MEM. FEE",
    "FINE",
    "STATUS",
  ];

  // 1. Fetch user data for all records to resolve programId and facultyId
  const userIds = Array.from(new Set(records.map((r) => r.userId).filter(Boolean)));
  const userMap = await batchFetchByIds("users", userIds);

  // 2. Collect unique program IDs and fetch programs/faculties
  const programIds = new Set<string>();
  userMap.forEach((u) => { if (u.programId) programIds.add(u.programId); });

  let programsMap: Record<string, Program> = {};
  if (programIds.size > 0) {
    try {
      programsMap = await batchGetPrograms(Array.from(programIds));
    } catch (err) {
      console.error("Error fetching programs for clearance export:", err);
    }
  }

  const facultyMap = new Map<string, Faculty>();
  try {
    const faculties = await getFaculties();
    if (faculties) {
      (faculties as Faculty[]).forEach((fac) => facultyMap.set(fac.id, fac));
    }
  } catch (err) {
    console.error("Error fetching faculties for clearance export:", err);
  }

  // 3. Collect all blocking item referenceIds, split by type.
  //    The `fees` collection documents preserve the original `amount` even after payment.
  //    The `fineItems` collection documents similarly store the original fine amount.
  const feeRefIds = new Set<string>();
  const fineRefIds = new Set<string>();

  records.forEach((c) => {
    Object.values(c.blockingItems ?? {}).forEach((item) => {
      if (item.type === PaymentType.FEES) feeRefIds.add(item.referenceId);
      else if (item.type === PaymentType.FINES) fineRefIds.add(item.referenceId);
    });
  });

  // Batch-fetch source documents that have the authoritative `amount` field
  const [feesDocMap, fineItemsDocMap] = await Promise.all([
    batchFetchByIds("fees", Array.from(feeRefIds)),
    batchFetchByIds("fineItems", Array.from(fineRefIds)),
  ]);

  // 4. Map records to rows
  const rows = records.map((c) => {
    const user = userMap.get(c.userId);
    const programId = user?.programId;
    const program = programId ? programsMap[programId] : undefined;

    const facultyId = user?.facultyId || program?.facultyId;
    const faculty = facultyId ? facultyMap.get(facultyId) : undefined;

    const studentId = c.studentId || user?.studentId || "N/A";
    const name =
      c.userName ||
      (user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "N/A");
    const programName =
      program?.acronym || program?.shortName || program?.code || program?.name || "N/A";
    const facultyName =
      faculty?.acronym || faculty?.code || faculty?.name || "N/A";

    // Sum the ORIGINAL amount from source documents (non-zero even for paid items).
    // Falls back to blockingItem.balance for any doc not found in the fetched map.
    const items = Object.values(c.blockingItems ?? {});

    const memFeeTotal = items
      .filter((item) => item.type === PaymentType.FEES)
      .reduce((sum, item) => {
        const sourceDoc = feesDocMap.get(item.referenceId);
        return sum + (sourceDoc?.amount ?? item.balance ?? 0);
      }, 0);

    const fineTotal = items
      .filter((item) => item.type === PaymentType.FINES)
      .reduce((sum, item) => {
        const sourceDoc = fineItemsDocMap.get(item.referenceId);
        return sum + (sourceDoc?.amount ?? item.balance ?? 0);
      }, 0);

    // Plain numeric values — no peso sign
    const formattedMemFee = memFeeTotal > 0 ? memFeeTotal.toLocaleString() : "0";
    const formattedFine = fineTotal > 0 ? fineTotal.toLocaleString() : "0";

    const statusDisplay =
      c.status === "cleared"
        ? "Cleared"
        : c.status === "pending"
        ? "Pending"
        : "Not Cleared";

    return [
      csvCell(studentId),
      csvCell(name),
      csvCell(programName),
      csvCell(facultyName),
      csvCell(formattedMemFee),
      csvCell(formattedFine),
      csvCell(statusDisplay),
    ].join(",");
  });

  const csvContent = [headers.map(csvCell).join(","), ...rows].join("\r\n");

  // Trigger browser download — BOM (\uFEFF) ensures Excel reads UTF-8 correctly
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

