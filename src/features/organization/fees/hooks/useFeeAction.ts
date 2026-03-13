import { useState } from "react";
import { PaymentLog } from "../types";
import { approvePaymentTransaction, fetchFee, recordManualPaymentAndUpdateClearance, rejectPaymentTransaction } from "@/firebase/fees";
import { toast } from "sonner";
import { getCurrentUserData } from "@/firebase";
import { Member } from "../../members/types";

export const useFeeAction = async (onSuccess?: (feeId: string) => void) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const user  = await getCurrentUserData() as unknown as Member;
    const userId = user?.id;

    const addManualPayment = async (feeId: string, amount: string, method: "gcash" | "cash" | "bank_transfer" | "waiver", ref?: string) => {
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        const feeData = await fetchFee(feeId);
        if (!feeData) {
            throw new Error("Fee not found");
        }

        try {
            await recordManualPaymentAndUpdateClearance(feeId, amount, method, userId || "", feeData.userId, user?.firstName + " " + user?.lastName || "",ref)
            setSuccess(true);
            toast.success("Payment recorded successfully!");
            onSuccess?.(feeId);
        } catch (err) {
            setError("Failed to perform action");
            toast.error("Failed to record payment");
        } finally {
            setIsSubmitting(false);
        }
    };

    const approvePayment = async (feeId: string, logId: string) => {
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        try {
            await approvePaymentTransaction(feeId, logId, userId || "")
            setSuccess(true);
            toast.success("Payment approved successfully!");
            onSuccess?.(feeId);
        } catch (err) {
            setError("Failed to perform action");
            toast.error("Failed to approve payment");
        } finally {
            setIsSubmitting(false);
        }
    };

    const rejectPayment = async (feeId: string, logId: string, reason: string) => {
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        try {
            await rejectPaymentTransaction(feeId, logId, userId || "", reason)
            setSuccess(true);
            toast.success("Payment rejected successfully!");
            onSuccess?.(feeId);
        } catch (err) {
            setError("Failed to perform action");
            toast.error("Failed to reject payment");
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        isSubmitting,
        error,
        success,
        addManualPayment,
        approvePayment,
        rejectPayment,
    };
}
