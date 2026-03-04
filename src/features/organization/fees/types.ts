import { Timestamp } from "firebase/firestore"

export type Fees = {
    orgId: string,
    userId: string,
    userName: string, 
    studentId: string,
    feeType: string,
    title: string,
    description?: string,
    academicYear?: string,
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