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
  payment_number: number;
  amount: number;
  payment_method: PaymentMethod;
  payment_proof_id?: string | null;
  gcash_reference?: string | null;
  status: PaymentStatus;
  
  // Timestamps from Firestore
  paid_at: Timestamp;
  
  verified_by?: string | null;
  verified_at?: Timestamp | null;
  rejection_reason?: string | null;
  notes?: string | null;
  
  // Using Record<string, any> for maps/flexible objects
  metadata?: Record<string, any> | null;
  
  created_at: Timestamp;
}