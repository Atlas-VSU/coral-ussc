import { useState } from "react";
import { PaymentLog } from "../types";
import { recordManualPayment } from "@/firebase/fees";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const useFeeAction = () => {
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
        } catch (err) {
            setError("Failed to perform action");
            toast.error("Failed to record payment");
        } finally {
            setIsSubmitting(false);
        }
    };

    const approvePayment = async (logId: string) => {
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        try {
            await approvePayment(logId);
            setSuccess(true);
            toast.success("Payment approved successfully!");
        } catch (err) {
            setError("Failed to perform action");
            toast.error("Failed to approve payment");
        } finally {
            setIsSubmitting(false);
        }
    };

    const rejectPayment = async (logId: string, reason: string) => {
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        try {
            await rejectPayment(logId, reason);
            setSuccess(true);
            toast.success("Payment rejected successfully!");
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
