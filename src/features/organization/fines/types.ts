import { PaymentStatus } from "@/constants/status";
import { Timestamp } from "firebase/firestore";

export type FineType = {
    id?: string;
    orgId?: string;
    name: string;
    description: string;
    defaultAmount: number;
    requiresTimeIn: boolean;
    requiresTimeOut?: boolean;
    majorEventsOnly: boolean;
    isActive: boolean;
}

export type ProofOfPayment = {
    id?: string;
    orgId: string;
    firstName: string;
    lastName: string;
    studentId: string;
    paymentType: string;
    paymentHistoryId?: string;
    referenceId: string;
    senderNumber: string;
    referenceNumber: string;
    amount: number;
    imageUrl: string;
    status: PaymentStatus;
    submittedAt: string;
    verifiedBy?: string;
    verifiedByName?: string;
    verifiedAt?: string;
    rejectionReason?: string;
    notes?: string;
}

export type StudentFines = {
    id?: string;
    orgId: string;
    userId: string;
    userName: string;
    studentId: string;
    academicYear: string;
    semester: string;
    accumulatedAmount: number;
    paidAmount: number;
    balance: number;
    status: "pending" | "partial" | "paid" | "waived";
    fineItemsCount: number;
    reason: string | null;
    firstFineIssuedAt: Timestamp | null;
    lastFineIssuedAt: Timestamp | null;
    dueDate: Timestamp |null;
    waivedAmount: number | null;
    waivedBy: string | null,
    waivedReason:string | null,
    waivedAt: Timestamp | null,
    remarks: string | null,
}

export type FineGenerationPhase =
  | "preflight"   // fetching event, fine type, user lists
  | "absent"      // writing fines for absent users
  | "partial"     // writing fines for partial attendees
  | "done"        // all writes committed successfully
  | "error";      // something went wrong

export type FineGenerationProgress = {
  phase: FineGenerationPhase;

  // Per-phase batch counters (only present during "absent" / "partial")
  batchNum?: number;
  totalBatches?: number;

  // Running totals across both phases
  absentTotal: number;
  absentDone: number;
  partialTotal: number;
  partialDone: number;

  // Human-readable status line for the UI log
  message: string;
};

// Convenience alias so callers don't have to type the full signature
export type OnFineProgress = (update: FineGenerationProgress) => void;


export type BulkFinesProgress = {
  phase: "preflight" | "writing" | "done" | "error";
  message: string;
  committed: number;
  totalUsers: number;
  batchNum?: number;
  totalBatches?: number;
};

export type BulkFinesResult = {
  success: boolean;
  totalUsers: number;
  committed: number;
  failedAtBatch: number | null; // null = no failure
};

export type OnBulkFinesProgress = (update: BulkFinesProgress) => void;

