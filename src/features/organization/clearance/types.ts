import { Timestamp } from "firebase/firestore";
import { PaymentLog } from "../fees/types";
import { PaymentType } from "@/constants/types";

export interface ClearanceStatus {
  id: string; 
  orgId: string; 
  userId: string; 
  userName: string; 
  studentId: string; 
  academicYear: string; 
  semester: string; 
  status: 'pending' | 'cleared' | 'not_cleared';
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
  type: PaymentType;
  referenceId: string; 
  title: string; 
  balance: number;
  status: "unpaid" | "paid";
  paymentHistory: PaymentLog[];
  pendingReview: boolean;
  isRequiredForClearance: boolean; 
}