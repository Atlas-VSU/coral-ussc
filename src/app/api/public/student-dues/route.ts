import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/firebase/firebase-admin.config";

type FeeRecord = {
  id: string;
  orgId?: string;
  title?: string;
  feeType?: string;
  balance?: number;
  amount?: number;
  dueDate?: string;
  isArchived?: boolean;
  status?: string;
};

type FineRecord = {
  id: string;
  orgId?: string;
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

  return undefined;
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

    if (!studentId) {
      return NextResponse.json(
        {
          success: false,
          error: "Student ID is required.",
        },
        { status: 400 }
      );
    }

    const [feesSnapshot, finesSnapshot] = await Promise.all([
      adminDb.collection("fees").where("studentId", "==", studentId).get(),
      adminDb.collection("fines").where("studentId", "==", studentId).get(),
    ]);

    const grouped = new Map<
      string,
      {
        orgId: string;
        feeAmount: number;
        fineAmount: number;
        fees: Array<{ id: string; description: string; amount: number; dueDate?: string }>;
        fines: Array<{ id: string; description: string; amount: number; date?: string; reason: string }>;
      }
    >();

    for (const doc of feesSnapshot.docs) {
      const fee = { id: doc.id, ...doc.data() } as FeeRecord;
      if (!fee.orgId) continue;
      if (fee.isArchived) continue;

      const outstanding = asNumber(fee.balance) > 0 ? asNumber(fee.balance) : asNumber(fee.amount);
      if (outstanding <= 0) continue;

      const existing = grouped.get(fee.orgId) ?? {
        orgId: fee.orgId,
        feeAmount: 0,
        fineAmount: 0,
        fees: [],
        fines: [],
      };

      existing.feeAmount += outstanding;
      existing.fees.push({
        id: fee.id,
        description: fee.title || fee.feeType || "Outstanding Fee",
        amount: outstanding,
        dueDate: fee.dueDate,
      });

      grouped.set(fee.orgId, existing);
    }

    for (const doc of finesSnapshot.docs) {
      const fine = { id: doc.id, ...doc.data() } as FineRecord;
      if (!fine.orgId) continue;
      if (fine.metadata?.isArchived) continue;

      const outstanding =
        asNumber(fine.balance) > 0 ? asNumber(fine.balance) : asNumber(fine.accumulatedAmount);
      if (outstanding <= 0) continue;

      const existing = grouped.get(fine.orgId) ?? {
        orgId: fine.orgId,
        feeAmount: 0,
        fineAmount: 0,
        fees: [],
        fines: [],
      };

      existing.fineAmount += outstanding;
      existing.fines.push({
        id: fine.id,
        description: fine.reason || "Outstanding Fine",
        amount: outstanding,
        date: toIsoDate(fine.dueDate) || toIsoDate(fine.lastFineIssuedAt),
        reason: fine.reason || "Fine/penalty charge",
      });

      grouped.set(fine.orgId, existing);
    }

    const orgIds = Array.from(grouped.keys());
    const orgDocs = await Promise.all(orgIds.map((orgId) => adminDb.collection("users").doc(orgId).get()));

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
          name: display.name,
          acronym: display.acronym,
          outstandingAmount: due.feeAmount + due.fineAmount,
          feeAmount: due.feeAmount,
          fineAmount: due.fineAmount,
          fees: due.fees,
          fines: due.fines,
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
