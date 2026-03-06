import { useState } from "react";
import { PaymentLog } from "../types";
import { approvePaymentTransaction, recordManualPayment, rejectPaymentTransaction } from "@/firebase/fees";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const useFeeAction = (onSuccess?: (feeId: string) => void) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const { user } = useAuth();
    const userId = user?.uid;

    const addManualPayment = async (feeId: string, amount: string, method: "gcash" | "cash" | "bank_transfer" | "waiver", ref?: string) => {
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        try {
            await recordManualPayment(feeId, amount, method, userId || "", ref)
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
