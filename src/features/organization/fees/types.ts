import { Timestamp } from "firebase/firestore"

export type Fee = {
    id: string,
    orgId: string,
    userId: string,
    userName: string, 
    studentId: string,
    feeType: string,
    title: string,
    description?: string,
    academicYear: string,
    semester?: string,
    eventId?: string,
    amount: number,
    paidAmount: number,
    balance: number, 
    status: string,
    dueDate: string,
    isRequiredForClearance: boolean, 
    waivedReason?: string,
    waivedAt?: string,
    remarks?: string,
    metadata?: string,
    createdBy: string,
    createdAt: Timestamp, 
    updatedAt: Timestamp,
    isArchived: boolean
}


export type PaymentMethod = "gcash" | "cash" | "bank_transfer" | "waiver";
export type PaymentStatus = "pending_verification" | "verified" | "rejected";

export interface PaymentLog {
  id: string;
  paymentNumber: number;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentProofId?: string | null;
  gcashReference?: string | null;
  status: PaymentStatus;
  
  // Timestamps from Firestore
  paidAt: Timestamp;
  
  verifiedBy?: string | null;
  verifiedAt?: Timestamp | null;
  verifiedByName?: string | null;
  rejectionReason?: string | null;
  notes?: string | null;
  
  // Using Record<string, any> for maps/flexible objects
  metadata?: Record<string, any> | null;
  
  createdAt: Timestamp;
}

export interface AggregatedFee {
  id: string                // use title + type + amount as a composite key
  title: string
  type: string
  amount: number
  academicYear: string
  semester: string
  dueDate?: string
  isRequiredForClearance: boolean
  totalStudents: number
  paidCount: number
  // we might not have description in backend, so omit or use optional
  description?: string
}

export interface FeeWithPaymentHistory extends Fee {
    paymentHistory: PaymentLog[];
}