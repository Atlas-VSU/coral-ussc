import { Timestamp } from "firebase/firestore";
import { PaymentLog } from "../fees/types";

export interface ClearanceStatus {
  id: string; 
  orgId: string; 
  userId: string; 
  userName: string; 
  studentId: string; 
  academicYear: string; 
  semester: string; 
  status: 'pending' | 'cleared' | 'overdue';
  visibility: 'public' | 'private';
  blockingItems: Record<string, BlockingItem>; 
  clearanceDate: Timestamp | null; 
  lastCalculatedAt: Timestamp; 
  startDate: Timestamp; 
  dueDate: Timestamp; 
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isArchived: boolean; 
}

export interface BlockingItem {
  type: 'membership_fee' | 'fee' | 'fine';
  referenceId: string; 
  title: string; 
  balance: number;
  status: "unpaid" | "paid";
  paymentHistory: PaymentLog[];
  pendingReview: boolean;
  isRequiredForClearance: boolean; 
}