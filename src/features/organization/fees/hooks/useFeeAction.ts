import { useState } from "react";
import { PaymentLog } from "../types";
import { approvePaymentTransaction, fetchFee, recordManualPaymentAndUpdateClearance, rejectPaymentTransaction } from "@/firebase/fees";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { collection, doc, getDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase.config";
import { verifyPaymentHistory, rejectPaymentHistory } from "@/firebase/payment/update/paymentHistory";
import { ProofOfPayment } from "@/features/organization/fines/types";
import { PaymentStatus } from "@/constants/status";

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
            // Fetch the payment log and its associated proof of payment to construct the ProofOfPayment object
            const feeRef = doc(db, "fees", feeId);
            const logRef = doc(feeRef, "paymentHistory", logId);
            const logSnap = await getDoc(logRef);
            
            if (!logSnap.exists()) throw new Error("Payment log not found");
            const logData = logSnap.data();
            console.log(logData);
            if (!logData.paymentProofId) {
                // FALLBACK: If no proof ID, use the old direct transaction method or handle as manual
                await approvePaymentTransaction(feeId, logId, userId || "");
            } else {
                const proofRef = doc(db, "proofOfPayments", logData.paymentProofId);
                const proofSnap = await getDoc(proofRef);
                if (!proofSnap.exists()) throw new Error("Proof of payment not found");
                
                const proofData = proofSnap.data() as ProofOfPayment;
                proofData.status = PaymentStatus.VERIFIED;
                proofData.verifiedBy = userId || "";
                proofData.verifiedByName = user?.firstName + " " + user?.lastName || "";
                
                await verifyPaymentHistory(logId, proofData);
            }

            setSuccess(true);
            toast.success("Payment approved successfully!");
            onSuccess?.(feeId);
        } catch (err) {
            console.error(err);
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
            const feeRef = doc(db, "fees", feeId);
            const logRef = doc(feeRef, "paymentHistory", logId);
            const logSnap = await getDoc(logRef);
            
            if (!logSnap.exists()) throw new Error("Payment log not found");
            const logData = logSnap.data();
            console.log(logData);
            if (!logData.paymentProofId) {
                await rejectPaymentTransaction(feeId, logId, userId || "", reason);
            } else {
                const proofRef = doc(db, "proofOfPayments", logData.paymentProofId);
                const proofSnap = await getDoc(proofRef);
                if (!proofSnap.exists()) throw new Error("Proof of payment not found");
                
                const proofData = proofSnap.data() as ProofOfPayment;
                proofData.status = PaymentStatus.REJECTED;
                proofData.verifiedBy = userId || "";
                proofData.verifiedByName = user?.firstName + " " + user?.lastName || "";
                proofData.rejectionReason = reason;
                
                await rejectPaymentHistory(logId, proofData);
            }

            setSuccess(true);
            toast.success("Payment rejected successfully!");
            onSuccess?.(feeId);
        } catch (err) {
            console.error(err);
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
