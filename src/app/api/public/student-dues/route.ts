import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/firebase/firebase-admin.config";
import { Timestamp } from "firebase-admin/firestore";
import { FineItem } from "@/features/organization/fines/types";

type FeeRecord = {
  id: string;
  orgId?: string;
  title?: string;
  feeType?: string;
  balance?: number;
  amount?: number;
  dueDate?: unknown;
  isArchived?: boolean;
  academicYear?: string;
  semester?: string;
  status?: string;
};

type FineRecord = {
  id: string;
  orgId?: string;
  fineItemsCount?: number;
  reason?: string | null;
  balance?: number;
  accumulatedAmount?: number;
  dueDate?: { toDate?: () => Date } | Date | string | null;
  lastFineIssuedAt?: { toDate?: () => Date } | Date | string | null;
  status?: string;
  metadata?: {
    isArchived?: boolean;
  };
};

type PaymentLogRecord = {
  status?: string;
  rejectionReason?: string | null;
  createdAt?: unknown;
  verifiedAt?: unknown;
  metaData?: {
    updatedAt?: unknown;
  };
};

const isPendingSubmissionStatus = (status: unknown): boolean => {
  if (typeof status !== "string") return false;
  return status === "pending" || status === "pending";
};

const isVerifiedSubmissionStatus = (status: unknown): boolean => {
  if (typeof status !== "string") return false;
  return status === "verified";
};

const isBlockedByPaymentHistoryStatus = (status: unknown): boolean => {
  if (typeof status !== "string") return false;
  return status === "verified";
};

const asNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return 0;
};

const toIsoDate = (value: unknown): string | undefined => {
  if (!value) return undefined;

  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
  }

  if (typeof value === "object" && value && "toDate" in value) {
    const maybeTimestamp = value as { toDate?: () => Date };
    const date = maybeTimestamp.toDate?.();
    if (date && !Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "_seconds" in value &&
    typeof (value as { _seconds?: unknown })._seconds === "number"
  ) {
    const seconds = (value as { _seconds: number })._seconds;
    return new Date(seconds * 1000).toISOString();
  }

  return undefined;
};

const toMillis = (value: unknown): number => {
  if (!value) return 0;

  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? 0 : value.getTime();
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  }

  if (typeof value === "object" && value && "toDate" in value) {
    const maybeTimestamp = value as { toDate?: () => Date };
    const date = maybeTimestamp.toDate?.();
    return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "_seconds" in value &&
    typeof (value as { _seconds?: unknown })._seconds === "number"
  ) {
    return (value as { _seconds: number })._seconds * 1000;
  }

  return 0;
};

const getLatestRejectedReason = (logs: PaymentLogRecord[]): string | undefined => {
  const rejectedLogs = logs
    .filter((log) => log.status === "rejected" && typeof log.rejectionReason === "string")
    .map((log) => ({
      reason: (log.rejectionReason ?? "").trim(),
      updatedAt: Math.max(
        toMillis(log.verifiedAt),
        toMillis(log.metaData?.updatedAt),
        toMillis(log.createdAt)
      ),
    }))
    .filter((entry) => entry.reason.length > 0)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return rejectedLogs[0]?.reason;
};

const normalizePaymentState = (
  status: unknown
): "unpaid" | "pending" | "rejected" | "verified" => {
  if (status === "pending") return "pending";
  if (status === "verified") return "verified";
  if (status === "rejected") return "rejected";
  return "unpaid";
};

const getLatestPaymentHistoryState = (
  logs: PaymentLogRecord[]
): "pending" | "verified" | "rejected" | undefined => {
  const latest = logs
    .map((log) => ({
      status: log.status,
      updatedAt: Math.max(
        toMillis(log.verifiedAt),
        toMillis(log.metaData?.updatedAt),
        toMillis(log.createdAt)
      ),
    }))
    .filter(
      (entry): entry is { status: "pending" | "verified" | "rejected"; updatedAt: number } =>
        entry.status === "pending" || entry.status === "verified" || entry.status === "rejected"
    )
    .sort((a, b) => b.updatedAt - a.updatedAt)[0];

  return latest?.status;
};

const buildOrgDisplay = (orgId: string, data: Record<string, unknown> | undefined) => {
  const acronym =
    String(data?.acronym ?? "").trim() ||
    String(data?.shortName ?? "").trim() ||
    String(data?.code ?? "").trim() ||
    "ORG";

  const fullName =
    String(data?.organizationName ?? "").trim() ||
    String(data?.name ?? "").trim() ||
    `${String(data?.firstName ?? "").trim()} ${String(data?.lastName ?? "").trim()}`.trim() ||
    String(data?.email ?? "").trim() ||
    orgId;

  return { acronym, name: fullName };
};

export async function GET(request: NextRequest) {
  try {
    const studentId = request.nextUrl.searchParams.get("studentId")?.trim();
    const AY = request.nextUrl.searchParams.get("AY")?.trim();
    const semester = request.nextUrl.searchParams.get("semester")?.trim();

    if (!studentId) {
      return NextResponse.json(
        {
          success: false,
          error: "Student ID is required.",
        },
        { status: 400 }
      );
    }

    // Base queries
    let feesQuery: FirebaseFirestore.Query = adminDb.collection("fees").where("studentId", "==", studentId);
    let finesQuery: FirebaseFirestore.Query = adminDb.collection("fines").where("studentId", "==", studentId);

    // Filter fees by term explicitly
    if (AY && semester) {
      feesQuery = feesQuery
        .where("academicYear", "==", AY)
        .where("semester", "==", semester);
    }

    const [feesSnapshot, finesSnapshot] = await Promise.all([
      feesQuery.get(),
      finesQuery.get(),
    ]);

    const grouped = new Map<
      string,
      {
        orgId: string;
        feeAmount: number;
        fineAmount: number;
        paymentSummary: {
          pending: number;
          verified: number;
          rejected: number;
          unpaid: number;
        };
        fees: Array<{
          id: string;
          description: string;
          amount: number;
          dueDate?: string;
          latestRejectionReason?: string;
          isPayable: boolean;
          academicYear: string;
          semester: string;
          paymentState: "unpaid" | "pending" | "rejected" | "verified";
        }>;
        fines: Array<{
          id: string;
          description: string;
          amount: number;
          date?: string;
          reason: string;
          latestRejectionReason?: string;
          isPayable: boolean;
          paymentState: "unpaid" | "pending" | "rejected" | "verified";
        }>;
        fineItems: Array<{
          refId: string,
          title: string,
          amount: number,
          parentFineId: string,
          isPaid: boolean,
          isPending: boolean,
          date: Timestamp,
        }>;
      }
    >();

    // Process Fees
    for (const doc of feesSnapshot.docs) {
      const fee = { id: doc.id, ...doc.data() } as FeeRecord;
      if (!fee.orgId) continue;
      if (fee.isArchived) continue;

      const feePaymentHistorySnapshot = await adminDb
        .collection("fees")
        .doc(fee.id)
        .collection("paymentHistory")
        .get();
      const feePaymentLogs = feePaymentHistorySnapshot.docs.map(
        (paymentDoc) => paymentDoc.data() as PaymentLogRecord
      );

      const latestRejectionReason = getLatestRejectedReason(feePaymentLogs);
      const latestHistoryState = getLatestPaymentHistoryState(feePaymentLogs);
      const paymentState: "unpaid" | "pending" | "rejected" | "verified" = latestHistoryState
        ? normalizePaymentState(latestHistoryState)
        : normalizePaymentState(fee.status);
      const isPayable = paymentState === "unpaid" || paymentState === "rejected";

      const outstanding = asNumber(fee.balance) > 0 ? asNumber(fee.balance) : asNumber(fee.amount);
      const existing = grouped.get(fee.orgId) ?? {
        orgId: fee.orgId,
        feeAmount: 0,
        fineAmount: 0,
        paymentSummary: { pending: 0, verified: 0, rejected: 0, unpaid: 0 },
        fees: [],
        fines: [],
        fineItems:[],
      };

      if (paymentState === "pending") existing.paymentSummary.pending += 1;
      else if (paymentState === "verified") existing.paymentSummary.verified += 1;
      else if (paymentState === "rejected") existing.paymentSummary.rejected += 1;
      else existing.paymentSummary.unpaid += 1;

      existing.feeAmount += outstanding > 0 ? outstanding : 0;
      existing.fees.push({
        id: fee.id,
        description: fee.title || fee.feeType || "Outstanding Fee",
        amount: outstanding,
        dueDate: toIsoDate(fee.dueDate),
        latestRejectionReason,
        isPayable,
        academicYear: fee.academicYear || "2025-2026",
        semester: fee.semester || "2nd",
        paymentState,
      });

      grouped.set(fee.orgId, existing);
    }

    // Process Fines
    for (const doc of finesSnapshot.docs) {
      const fine = { id: doc.id, ...doc.data() } as FineRecord;
      if (!fine.orgId) continue;
      if (fine.metadata?.isArchived) continue;

      let fineItemsQuery: FirebaseFirestore.Query = adminDb
        .collection("fines")
        .doc(fine.id)
        .collection("fineItems");

      // Filter fine items by term explicitly
      if (AY && semester) {
        fineItemsQuery = fineItemsQuery
          .where("academicYear", "==", AY)
          .where("semester", "==", semester);
      }

      // Concurrently fetch payment history and the correctly filtered items for THIS specific fine
      const [finePaymentHistorySnapshot, fineItemsSnapshot] = await Promise.all([
        adminDb.collection("fines").doc(fine.id).collection("paymentHistory").get(),
        fineItemsQuery.get()
      ]);

      const finePaymentLogs = finePaymentHistorySnapshot.docs.map(
        (paymentDoc) => paymentDoc.data() as PaymentLogRecord
      );

      const latestRejectionReason = getLatestRejectedReason(finePaymentLogs);
      const latestHistoryState = getLatestPaymentHistoryState(finePaymentLogs);
      const paymentState: "unpaid" | "pending" | "rejected" | "verified" = latestHistoryState
        ? normalizePaymentState(latestHistoryState)
        : normalizePaymentState(fine.status);
      const isPayable = paymentState === "unpaid" || paymentState === "rejected";

      const outstanding = asNumber(fine.balance) > 0 ? asNumber(fine.balance) : asNumber(fine.accumulatedAmount);
      
      const items = []; 
      for (const itemDoc of fineItemsSnapshot.docs) {
        const fineItem = { id: itemDoc.id, ...itemDoc.data() } as FineItem;
        if (!fineItem.isPaid) {
          items.push({
            refId: fineItem.id,
            title: fineItem.eventName,
            amount: fineItem.amount,
            parentFineId: fine.id,
            isPaid: fineItem.isPaid ?? false,
            isPending: fineItem.isPending ?? false,
            date: fineItem.eventDate,
          });
        }
      }

      // If a term was selected, and this fine has no unpaid items for that term, skip adding this fine entirely
      if (AY && semester && items.length === 0) continue;

      const existing = grouped.get(fine.orgId) ?? {
        orgId: fine.orgId,
        feeAmount: 0,
        fineAmount: 0,
        paymentSummary: { pending: 0, verified: 0, rejected: 0, unpaid: 0 },
        fees: [],
        fines: [],
        fineItems: [],
      };

      if (paymentState === "pending") existing.paymentSummary.pending += 1;
      else if (paymentState === "verified") existing.paymentSummary.verified += 1;
      else if (paymentState === "rejected") existing.paymentSummary.rejected += 1;
      else if (paymentState === "unpaid" && fine.fineItemsCount! > 0) existing.paymentSummary.unpaid += 1;

      existing.fineAmount += outstanding > 0 ? outstanding : 0;
      existing.fines.push({
        id: fine.id,
        description: fine.reason || "Outstanding Fine",
        amount: outstanding,
        date: toIsoDate(fine.dueDate) || toIsoDate(fine.lastFineIssuedAt),
        reason: fine.reason || "Fine/penalty charge",
        latestRejectionReason,
        isPayable,
        paymentState,
      });

      items.forEach((item) => {
        existing.fineItems.push(item)
      });

      grouped.set(fine.orgId, existing);
    }

    // Fetch Unique Organizations
    const orgIds = Array.from(grouped.keys());
    const orgDocs = await Promise.all(
      orgIds.map((orgId) => adminDb.collection("organizations").doc(orgId).get())
    );
    const organizations = orgIds
      .map((orgId, index) => {
        const due = grouped.get(orgId);
        if (!due) return null;

        const orgData = orgDocs[index].exists
          ? (orgDocs[index].data() as Record<string, unknown>)
          : undefined;
        const display = buildOrgDisplay(orgId, orgData);

        return {
          id: orgId,
          name: orgData?.name ? String(orgData.name) : display.name, 
          acronym: display.acronym,
          outstandingAmount: due.feeAmount + due.fineAmount,
          feeAmount: due.feeAmount,
          fineAmount: due.fineAmount,
          paymentSummary: due.paymentSummary,
          fees: due.fees,
          fines: due.fines,
          fineItems: due.fineItems,
          orgTreasurerName: orgData?.orgTreasurerName || null,
          orgTreasurerUrl: orgData?.orgTreasurerUrl || null,
          orgAuditorName: orgData?.orgAuditorName || null,
          orgAuditorUrl: orgData?.orgAuditorUrl || null,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (a?.name || "").localeCompare(b?.name || ""));

    return NextResponse.json({
      success: true,
      organizations,
    });
  } catch (error) {
    console.error("Error fetching public student dues:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch student dues.",
      },
      { status: 500 }
    );
  }
}