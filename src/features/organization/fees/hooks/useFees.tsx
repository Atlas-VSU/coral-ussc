"use client";

import { useState, useCallback, useEffect } from "react";
import { 
    collection, 
    writeBatch, 
    doc, 
    Timestamp 
} from "firebase/firestore";
import { getCurrentUser, getCurrentUserData } from "@/firebase";
import { Fees } from "../types";
import { Member } from "../../members/types";
import { toast } from "sonner";
import { db } from "@/firebase/firebase.config";

export function useFees() {
    const [fees, setFees] = useState<Fees[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [currentUserData, setCurrentUserData] = useState<any>()
   useEffect(() => {
       const fetchCurrentUser = async () => {
         setCurrentUserData(await getCurrentUserData())
       }
       fetchCurrentUser()
     }, [])

    const addStudentsToBatch = useCallback((students: Member[], feeType: string, title: string, amount: number, dueDate: string, isRequiredForClearance: boolean) => {
        setFees(prev => {
            const newFees = students
                .filter(student => !prev.some(f => f.student_id === student.studentId))
                .map(student => ({
                    org_id: currentUserData?.uid, 
                    user_id: student.id || "",
                    user_name: `${student.firstName} ${student.lastName}`,
                    student_id: student.studentId,
                    fee_type: feeType,
                    title: title,
                    amount: amount,
                    paid_amount: 0,
                    balance: 0,
                    status: "unpaid",
                    due_date: dueDate,
                    is_required_for_clearance: isRequiredForClearance,
                    created_by: currentUserData?.uid, 
                    created_at: Timestamp.now(),
                    updated_at: Timestamp.now(),
                    is_archived: false,
                }));
            return [...prev, ...newFees];
        });
    }, []);

    /**
     * Updates common details for all fees in the current batch.
     */
    const updateBatchDetails = useCallback((details: Partial<Fees>) => {
        setFees(prev => prev.map(fee => {
            const updatedFee = { ...fee, ...details };
            // Recalculate balance if amount or paid_amount changes
            if ('amount' in details || 'paid_amount' in details) {
                updatedFee.balance = updatedFee.amount - updatedFee.paid_amount;
            }
            return updatedFee;
        }));
    }, []);

    /**
     * Updates a specific fee in the batch.
     */
    const updateIndividualFee = useCallback((studentId: string, details: Partial<Fees>) => {
        setFees(prev => prev.map(fee => {
            if (fee.student_id === studentId) {
                const updatedFee = { ...fee, ...details };
                if ('amount' in details || 'paid_amount' in details) {
                    updatedFee.balance = updatedFee.amount - updatedFee.paid_amount;
                }
                return updatedFee;
            }
            return fee;
        }));
    }, []);

    /**
     * Removes a student from the batch.
     */
    const removeStudentFromBatch = useCallback((studentId: string) => {
        setFees(prev => prev.filter(f => f.student_id !== studentId));
    }, []);

    /**
     * Saves the batch of fees to Firestore.
     */
    const saveBatch = async () => {
        if (fees.length === 0) {
            toast.error("No fees to save");
            return;
        }

        setIsSaving(true);
        try {
            if (!currentUserData) {
                toast.error("User session not found");
                return;
            }

            const batch = writeBatch(db);
            const feesCollection = collection(db, "fees");
            const now = Timestamp.now();

            fees.forEach(fee => {
                const docRef = doc(feesCollection);
                const finalFee: Fees = {
                    ...fee,
                    org_id: currentUserData.uid, // Adjust based on org structure
                    created_by: currentUserData.uid,
                    created_at: now,
                    updated_at: now,
                };
                batch.set(docRef, finalFee);
            });

            await batch.commit();
            toast.success(`Successfully generated ${fees.length} fees`);
            setFees([]); // Clear batch after successful save
        } catch (error) {
            console.error("Error saving batch fees:", error);
            toast.error("Failed to save fees");
        } finally {
            setIsSaving(false);
        }
    };

    return {
        fees,
        setFees,
        isSaving,
        addStudentsToBatch,
        updateBatchDetails,
        updateIndividualFee,
        removeStudentFromBatch,
        saveBatch
    };
}
