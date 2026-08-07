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
 * Converts an array of ClearanceStatus records to a RFC 4180-compliant CSV string
 * with refined formatting and requested columns:
 *   STUDENT ID | NAME | PROGRAM | FACULTY | MEM. FEE | FINE | STATUS (Cleared/Uncleared)
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
  const userMap = new Map<string, DocumentData>();

  if (userIds.length > 0) {
    const chunkSize = 30;
    for (let i = 0; i < userIds.length; i += chunkSize) {
      const chunk = userIds.slice(i, i + chunkSize);
      try {
        const usersSnap = await getDocs(
          query(collection(db, "users"), where(documentId(), "in", chunk))
        );
        usersSnap.docs.forEach((doc) => {
          userMap.set(doc.id, doc.data());
        });
      } catch (err) {
        console.error("Error fetching users for clearance export:", err);
      }
    }
  }

  // 2. Collect unique program IDs and faculty IDs
  const programIds = new Set<string>();
  const facultyIds = new Set<string>();

  userMap.forEach((u) => {
    if (u.programId) programIds.add(u.programId);
    if (u.facultyId) facultyIds.add(u.facultyId);
  });

  // 3. Fetch programs and faculties reference data
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
      (faculties as Faculty[]).forEach((fac) => {
        facultyMap.set(fac.id, fac);
      });
    }
  } catch (err) {
    console.error("Error fetching faculties for clearance export:", err);
  }

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

    // Separate blocking items into Fees and Fines
    const items = Object.values(c.blockingItems ?? {});
    const feeItems = items.filter(
      (item) => item.type === PaymentType.FEES
    );
    const fineItems = items.filter(
      (item) => item.type === PaymentType.FINES
    );

    const memFeeBalance = feeItems.reduce((sum, item) => {
      if (item.status === "unpaid" || item.balance > 0) {
        return sum + (item.balance || 0);
      }
      return sum;
    }, 0);

    const fineBalance = fineItems.reduce((sum, item) => {
      if (item.status === "unpaid" || item.balance > 0) {
        return sum + (item.balance || 0);
      }
      return sum;
    }, 0);

    const formattedMemFee =
      memFeeBalance > 0 ? `\u20B1${memFeeBalance.toLocaleString()}` : "0";
    const formattedFine =
      fineBalance > 0 ? `\u20B1${fineBalance.toLocaleString()}` : "0";

    const statusDisplay = c.status === "cleared" ? "Cleared" : "Uncleared";

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
