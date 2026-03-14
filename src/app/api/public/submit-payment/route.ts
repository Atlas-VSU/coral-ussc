import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/firebase/firebase-admin.config";

const submitPaymentSchema = z
  .object({
    userName: z.string().min(2, "Name is required"),
    studentId: z
      .string()
      .min(1, "Student ID is required")
      .regex(/^\d{2}-\d-\d{5}$/, "Student ID must follow format XX-X-XXXXX"),
    orgId: z.string().min(1, "Organization is required"),
    paymentMethod: z.enum(["gcash", "bank_transfer", "cash"]),
    referenceNumber: z.string().optional(),
    senderNumber: z.string().optional(),
    imageUrl: z.string().optional(),
    notes: z.string().optional(),
    fees: z.array(z.string()).default([]),
    fines: z.array(z.string()).default([]),
  })
  .superRefine((values, ctx) => {
    if (values.fees.length === 0 && values.fines.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fees"],
        message: "Select at least one fee or fine.",
      });
    }

    if (values.paymentMethod === "gcash") {
      const phoneRegex = /^([+]?63|0)9\d{9}$/;
      if (!values.senderNumber || !phoneRegex.test(values.senderNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["senderNumber"],
          message: "A valid sender number is required for GCash payments.",
        });
      }
    }

    if (
      (values.paymentMethod === "gcash" || values.paymentMethod === "bank_transfer") &&
      (!values.referenceNumber || values.referenceNumber.trim().length < 10)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["referenceNumber"],
        message: "Reference number is required for online payments.",
      });
    }
  });

type FeeRecord = {
  id: string;
  orgId?: string;
  userId?: string;
  studentId?: string;
  amount?: number;
  balance?: number;
  isArchived?: boolean;
  status?: string;
};

type FineRecord = {
  id: string;
  orgId?: string;
  userId?: string;
  studentId?: string;
  accumulatedAmount?: number;
  balance?: number;
  status?: string;
  metadata?: {
    isArchived?: boolean;
  };
};

const asNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return 0;
};

const resolveOutstanding = (balance: unknown, fallbackAmount: unknown): number => {
  const balanceValue = asNumber(balance);
  if (balanceValue > 0) return balanceValue;
  return asNumber(fallbackAmount);
};

const isPendingSubmissionStatus = (status: unknown): boolean => {
  if (typeof status !== "string") return false;
  return status === "pending" || status === "pending_verification";
};

const isBlockedByPaymentHistoryStatus = (status: unknown): boolean => {
  if (typeof status !== "string") return false;
  return status === "pending_verification" || status === "verified";
};

const DEBUG_PUBLIC_SUBMIT_PAYMENT = process.env.DEBUG_PUBLIC_SUBMIT_PAYMENT === "true";

const debugLog = (message: string, meta?: Record<string, unknown>) => {
  if (!DEBUG_PUBLIC_SUBMIT_PAYMENT) return;
  if (meta) {
    console.log(`[public/submit-payment] ${message}`);
    console.dir(meta, { depth: null });
    return;
  }
  console.log(`[public/submit-payment] ${message}`);
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = submitPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Invalid request payload.",
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const payload = parsed.data;
    debugLog("Payload validated", {
      studentId: payload.studentId,
      orgId: payload.orgId,
      paymentMethod: payload.paymentMethod,
      selectedFeeCount: payload.fees.length,
      selectedFineCount: payload.fines.length,
      hasImageUrl: Boolean(payload.imageUrl),
    });

    const userSnapshot = await adminDb
      .collection("users")
      .where("studentId", "==", payload.studentId)
      .where("isDeleted", "==", false)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      return NextResponse.json(
        {
          success: false,
          error: "Student record not found.",
        },
        { status: 404 }
      );
    }

    const studentDoc = userSnapshot.docs[0];
    const studentData = studentDoc.data();
    debugLog("Student record resolved", {
      studentDocId: studentDoc.id,
      role: studentData.role ?? null,
    });

    if (studentData.role && studentData.role !== "user") {
      return NextResponse.json(
        {
          success: false,
          error: "Student record not found.",
        },
        { status: 404 }
      );
    }

    const feeDocs = await Promise.all(payload.fees.map((feeId) => adminDb.collection("fees").doc(feeId).get()));
    const fineDocs = await Promise.all(payload.fines.map((fineId) => adminDb.collection("fines").doc(fineId).get()));

    const pendingFeeIds = feeDocs
      .filter((doc) => doc.exists)
      .map((doc) => ({ id: doc.id, ...doc.data() }) as FeeRecord)
      .filter(
        (fee) =>
          fee.orgId === payload.orgId &&
          fee.studentId === payload.studentId &&
          isPendingSubmissionStatus(fee.status)
      )
      .map((fee) => fee.id);

    const pendingFineIds = fineDocs
      .filter((doc) => doc.exists)
      .map((doc) => ({ id: doc.id, ...doc.data() }) as FineRecord)
      .filter(
        (fine) =>
          fine.orgId === payload.orgId &&
          fine.studentId === payload.studentId &&
          isPendingSubmissionStatus(fine.status)
      )
      .map((fine) => fine.id);

    const [lockedFeeIdsFromHistory, lockedFineIdsFromHistory] = await Promise.all([
      Promise.all(
        payload.fees.map(async (feeId) => {
          const paymentHistorySnapshot = await adminDb
            .collection("fees")
            .doc(feeId)
            .collection("paymentHistory")
            .get();

          const hasBlockingHistory = paymentHistorySnapshot.docs.some((paymentDoc) =>
            isBlockedByPaymentHistoryStatus(paymentDoc.data()?.status)
          );

          return hasBlockingHistory ? feeId : null;
        })
      ),
      Promise.all(
        payload.fines.map(async (fineId) => {
          const paymentHistorySnapshot = await adminDb
            .collection("fines")
            .doc(fineId)
            .collection("paymentHistory")
            .get();

          const hasBlockingHistory = paymentHistorySnapshot.docs.some((paymentDoc) =>
            isBlockedByPaymentHistoryStatus(paymentDoc.data()?.status)
          );

          return hasBlockingHistory ? fineId : null;
        })
      ),
    ]);

    const blockedFeeIds = Array.from(
      new Set([...pendingFeeIds, ...lockedFeeIdsFromHistory.filter((id): id is string => Boolean(id))])
    );
    const blockedFineIds = Array.from(
      new Set([...pendingFineIds, ...lockedFineIdsFromHistory.filter((id): id is string => Boolean(id))])
    );

    if (blockedFeeIds.length > 0 || blockedFineIds.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Some selected dues already have a pending/verified payment submission and cannot be paid again.",
          blocked: {
            fees: blockedFeeIds,
            fines: blockedFineIds,
          },
        },
        { status: 409 }
      );
    }

    const fees = feeDocs
      .filter((doc) => doc.exists)
      .map((doc) => ({ id: doc.id, ...doc.data() }) as FeeRecord)
      .filter(
        (fee) =>
          fee.orgId === payload.orgId &&
          fee.studentId === payload.studentId &&
          !fee.isArchived &&
            !blockedFeeIds.includes(fee.id) &&
          !isPendingSubmissionStatus(fee.status) &&
          resolveOutstanding(fee.balance, fee.amount) > 0
      );

    const fines = fineDocs
      .filter((doc) => doc.exists)
      .map((doc) => ({ id: doc.id, ...doc.data() }) as FineRecord)
      .filter(
        (fine) =>
          fine.orgId === payload.orgId &&
          fine.studentId === payload.studentId &&
          !fine.metadata?.isArchived &&
            !blockedFineIds.includes(fine.id) &&
          !isPendingSubmissionStatus(fine.status) &&
          resolveOutstanding(fine.balance, fine.accumulatedAmount) > 0
      );

    debugLog("Validated selected dues", {
      requestedFeeIds: payload.fees,
      requestedFineIds: payload.fines,
      validFeeIds: fees.map((fee) => fee.id),
      validFineIds: fines.map((fine) => fine.id),
      validFeeCount: fees.length,
      validFineCount: fines.length,
    });

    if (fees.length !== payload.fees.length || fines.length !== payload.fines.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Some selected dues are invalid or no longer payable.",
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const batchId = `${payload.studentId.replace(/[^0-9]/g, "")}-${now.getTime()}`;
    const paymentHistoryRef = adminDb.collection("paymentHistory").doc();
    const paymentHistoryItemsRef = paymentHistoryRef.collection("items");
    const proofCollection = adminDb.collection("proofOfPayments");
    const clearanceRef = adminDb.collection("clearanceStatus").doc(studentDoc.id);
    const clearanceSnapshot = await clearanceRef.get();
    debugLog("Clearance snapshot checked", {
      clearanceDocId: clearanceRef.id,
      clearanceExists: clearanceSnapshot.exists,
    });
    const batch = adminDb.batch();
    const submissionIds: string[] = [];
    const clearanceUpdates: Record<string, boolean> = {};
    const feeDebugEntries: Array<{ feeId: string; paymentHistoryId: string; path: string }> = [];
    const fineDebugEntries: Array<{ fineId: string; paymentHistoryId: string; path: string }> = [];

    const feeTotal = fees.reduce((sum, fee) => sum + resolveOutstanding(fee.balance, fee.amount), 0);
    const fineTotal = fines.reduce(
      (sum, fine) => sum + resolveOutstanding(fine.balance, fine.accumulatedAmount),
      0
    );
    const totalAmount = feeTotal + fineTotal;
    debugLog("Computed payment totals", {
      feeTotal,
      fineTotal,
      totalAmount,
    });

    batch.set(paymentHistoryRef, {
      id: paymentHistoryRef.id,
      orgId: payload.orgId,
      userId: studentDoc.id,
      userName: payload.userName,
      studentId: payload.studentId,
      paymentType: "bulk",
      paymentMethod: payload.paymentMethod,
      amount: totalAmount,
      status: "pending",
      paymentProofId: null,
      paymentNumber: now.getTime(),
      gcashReference: payload.referenceNumber ?? null,
      paidAt: now,
      verifiedBy: null,
      verifiedByName: null,
      verifiedAt: null,
      rejectionReason: null,
      notes: payload.notes ?? "Public payment portal submission.",
      metadata: {
        source: "public_payment_portal",
        batchId,
        submittedBy: "student",
        feeCount: fees.length,
        fineCount: fines.length,
      },
      createdAt: now,
    });

    for (const fee of fees) {
      const amount = resolveOutstanding(fee.balance, fee.amount);
      const paymentItemRef = paymentHistoryItemsRef.doc();
      // Per-fee subcollection log — required by verifyPaymentHistory / rejectPaymentHistory
      const feeLogRef = adminDb.collection("fees").doc(fee.id).collection("paymentHistory").doc();
      const docRef = proofCollection.doc();
      submissionIds.push(docRef.id);

      batch.set(paymentItemRef, {
        id: paymentItemRef.id,
        parentPaymentHistoryId: paymentHistoryRef.id,
        orgId: payload.orgId,
        userId: fee.userId ?? studentDoc.id,
        userName: payload.userName,
        studentId: payload.studentId,
        paymentType: "fees",
        referenceId: fee.id,
        amount,
        status: "pending",
        paidAt: now,
        verifiedBy: null,
        verifiedByName: null,
        verifiedAt: null,
        rejectionReason: null,
        notes: payload.notes ?? "",
        createdAt: now,
        metadata: {
          source: "public_payment_portal",
          batchId,
          submittedBy: "student",
        },
      });

      // Write the per-fee payment log so approval/rejection flows can find it
      batch.set(feeLogRef, {
        paymentNumber: now.getTime(),
        amount,
        paymentMethod: payload.paymentMethod,
        paymentProofId: docRef.id,
        gcashReference: payload.referenceNumber ?? null,
        senderNumber: payload.senderNumber ?? "",
        imageUrl: payload.imageUrl ?? "",
        status: "pending_verification",
        paidAt: now,
        verifiedBy: null,
        verifiedByName: null,
        verifiedAt: null,
        rejectionReason: null,
        notes: payload.notes ?? "",
        metaData: {
          source: "public_payment_portal",
          batchId,
          submittedBy: "student",
          parentPaymentHistoryId: paymentHistoryRef.id,
          paymentHistoryItemId: paymentItemRef.id,
        },
        createdAt: now,
      });

      feeDebugEntries.push({
        feeId: fee.id,
        paymentHistoryId: feeLogRef.id,
        path: `fees/${fee.id}/paymentHistory/${feeLogRef.id}`,
      });

      batch.set(docRef, {
        orgId: payload.orgId,
        userId: fee.userId ?? studentDoc.id,
        userName: payload.userName,
        studentId: payload.studentId,
        paymentType: "fees",
        paymentMethod: payload.paymentMethod,
        referenceId: fee.id,
        referenceNumber: payload.referenceNumber ?? "",
        senderNumber: payload.senderNumber ?? "",
        amount,
        imageUrl: payload.imageUrl ?? "",
        status: "pending",
        submittedAt: now,
        rejectionReason: "",
        notes: payload.notes ?? "",
        paymentHistoryId: feeLogRef.id,
        metaData: {
          source: "public_payment_portal",
          batchId,
          submittedBy: "student",
          parentPaymentHistoryId: paymentHistoryRef.id,
          paymentHistoryItemId: paymentItemRef.id,
          createdAt: now,
        },
      });

      batch.update(adminDb.collection("fees").doc(fee.id), {
        status: "pending",
        updatedAt: now,
      });

      clearanceUpdates[`blockingItems.${fee.id}.pendingReview`] = true;
    }

    for (const fine of fines) {
      const amount = resolveOutstanding(fine.balance, fine.accumulatedAmount);
      const paymentItemRef = paymentHistoryItemsRef.doc();
      // Per-fine subcollection log — required by verifyPaymentHistory / rejectPaymentHistory
      const fineLogRef = adminDb.collection("fines").doc(fine.id).collection("paymentHistory").doc();
      const docRef = proofCollection.doc();
      submissionIds.push(docRef.id);

      batch.set(paymentItemRef, {
        id: paymentItemRef.id,
        parentPaymentHistoryId: paymentHistoryRef.id,
        orgId: payload.orgId,
        userId: fine.userId ?? studentDoc.id,
        userName: payload.userName,
        studentId: payload.studentId,
        paymentType: "fines",
        referenceId: fine.id,
        amount,
        status: "pending",
        paidAt: now,
        verifiedBy: null,
        verifiedByName: null,
        verifiedAt: null,
        rejectionReason: null,
        notes: payload.notes ?? "",
        createdAt: now,
        metadata: {
          source: "public_payment_portal",
          batchId,
          submittedBy: "student",
        },
      });

      // Write the per-fine payment log so approval/rejection flows can find it
      batch.set(fineLogRef, {
        paymentNumber: now.getTime(),
        amount,
        paymentMethod: payload.paymentMethod,
        paymentProofId: docRef.id,
        gcashReference: payload.referenceNumber ?? null,
        senderNumber: payload.senderNumber ?? "",
        imageUrl: payload.imageUrl ?? "",
        status: "pending_verification",
        paidAt: now,
        verifiedBy: null,
        verifiedByName: null,
        verifiedAt: null,
        rejectionReason: null,
        notes: payload.notes ?? "",
        metaData: {
          source: "public_payment_portal",
          batchId,
          submittedBy: "student",
          parentPaymentHistoryId: paymentHistoryRef.id,
          paymentHistoryItemId: paymentItemRef.id,
        },
        createdAt: now,
      });

      fineDebugEntries.push({
        fineId: fine.id,
        paymentHistoryId: fineLogRef.id,
        path: `fines/${fine.id}/paymentHistory/${fineLogRef.id}`,
      });

      batch.set(docRef, {
        orgId: payload.orgId,
        userId: fine.userId ?? studentDoc.id,
        userName: payload.userName,
        studentId: payload.studentId,
        paymentType: "fines",
        paymentMethod: payload.paymentMethod,
        referenceId: fine.id,
        referenceNumber: payload.referenceNumber ?? "",
        senderNumber: payload.senderNumber ?? "",
        amount,
        imageUrl: payload.imageUrl ?? "",
        status: "pending",
        submittedAt: now,
        rejectionReason: "",
        notes: payload.notes ?? "",
        paymentHistoryId: fineLogRef.id,
        metaData: {
          source: "public_payment_portal",
          batchId,
          submittedBy: "student",
          parentPaymentHistoryId: paymentHistoryRef.id,
          paymentHistoryItemId: paymentItemRef.id,
          createdAt: now,
        },
      });

      batch.update(adminDb.collection("fines").doc(fine.id), {
        status: "pending",
        "metadata.updatedAt": now,
      });

      clearanceUpdates[`blockingItems.${fine.id}.pendingReview`] = true;
    }

    if (Object.keys(clearanceUpdates).length > 0 && clearanceSnapshot.exists) {
      batch.update(clearanceRef, clearanceUpdates);
    }

    debugLog("Committing Firestore batch", {
      paymentHistoryId: paymentHistoryRef.id,
      submissionCount: submissionIds.length,
      clearanceUpdateCount: Object.keys(clearanceUpdates).length,
      clearanceUpdated: Object.keys(clearanceUpdates).length > 0 && clearanceSnapshot.exists,
      feeCount: fees.length,
      fineCount: fines.length,
    });

    await batch.commit();

    const debugVerification = DEBUG_PUBLIC_SUBMIT_PAYMENT
      ? {
          fees: await Promise.all(
            feeDebugEntries.map(async (entry) => ({
              ...entry,
              exists: (await adminDb.doc(entry.path).get()).exists,
            }))
          ),
          fines: await Promise.all(
            fineDebugEntries.map(async (entry) => ({
              ...entry,
              exists: (await adminDb.doc(entry.path).get()).exists,
            }))
          ),
        }
      : undefined;

    debugLog("Batch committed successfully", {
      paymentHistoryId: paymentHistoryRef.id,
      submissionIds,
      debugVerification,
    });

    return NextResponse.json({
      success: true,
      message: "Payment submissions created successfully.",
      paymentHistoryId: paymentHistoryRef.id,
      submissionIds,
      summary: {
        feeCount: fees.length,
        fineCount: fines.length,
        feeAmount: feeTotal,
        fineAmount: fineTotal,
        totalAmount,
      },
      ...(DEBUG_PUBLIC_SUBMIT_PAYMENT
        ? {
            debug: {
              feePaymentHistory: debugVerification?.fees ?? feeDebugEntries,
              finePaymentHistory: debugVerification?.fines ?? fineDebugEntries,
            },
          }
        : {}),
    });
  } catch (error) {
    console.error("Error submitting public payment:", error);
    debugLog("Error details", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to submit payment.",
      },
      { status: 500 }
    );
  }
}
