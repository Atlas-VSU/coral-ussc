import { ClearanceStatus } from "@/features/organization/clearance/types";
import { Timestamp } from "firebase/firestore";

/** Formats a Firestore Timestamp (or null) into a readable date string. */
function formatTimestamp(ts: Timestamp | null): string {
  if (!ts) return "\u2014";
  return ts.toDate().toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Wraps a cell value in double quotes, escaping any existing quotes. */
function csvCell(value: string | number | boolean): string {
  const str = String(value ?? "").replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Converts an array of ClearanceStatus records to a RFC 4180-compliant CSV string
 * and triggers a browser download.
 *
 * Columns:
 *  Student ID | Full Name | Status | Cleared On | Academic Year | Semester | Blocking Items
 */
export function exportClearanceToCSV(
  records: ClearanceStatus[],
  filename = "clearance-export.csv"
): void {
  const headers = [
    "Student ID",
    "Full Name",
    "Status",
    "Cleared On",
    "Academic Year",
    "Semester",
    "Blocking Items",
  ];

  const rows = records.map((c) => {
    // Collect blocking items that still have an outstanding balance or unpaid status
    const unpaidItems = Object.values(c.blockingItems ?? {})
      .filter((item) => item.balance > 0 || item.status === "unpaid")
      .map((item) => `${item.title} (\u20B1${item.balance.toLocaleString()})`)
      .join("; ");

    return [
      csvCell(c.studentId),
      csvCell(c.userName),
      csvCell(c.status),
      csvCell(formatTimestamp(c.clearanceDate)),
      csvCell(c.academicYear),
      csvCell(c.semester),
      csvCell(unpaidItems || "None"),
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
