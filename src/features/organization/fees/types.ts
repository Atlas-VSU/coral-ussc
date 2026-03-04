import { Timestamp } from "firebase/firestore"

export type Fees = {
    org_id: string,
    user_id: string,
    user_name: string, 
    student_id: string,
    fee_type: string,
    title: string,
    description?: string,
    academic_year?: string,
    semester?: string,
    event_id?: string,
    amount: number,
    paid_amount: number,
    balance: number, 
    status: string,
    due_date: string,
    is_required_for_clearance: boolean, 
    waived_reason?: string,
    waived_at?: string,
    remarks?: string,
    metadata?: string,
    created_by: string,
    created_at: Timestamp, 
    updated_at: Timestamp,
    is_archived: boolean
}