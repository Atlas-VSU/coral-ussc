import { useState } from "react";
import { PaymentLog } from "../../fees/types";
import { approvePaymentTransaction, archiveFeeDocuments, fetchFee, recordManualPaymentAndUpdateClearance, rejectPaymentTransaction } from "@/firebase/fees";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { collection, doc, getDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase.config";
import { verifyPaymentHistory, rejectPaymentHistory } from "@/firebase/payment/update/paymentHistory";
import { ProofOfPayment } from "@/features/organization/fines/types";
import { PaymentStatus } from "@/constants/status";
import { ReceiptData } from "@/components/organization/receipt/PaymentReceiptDialog";
import { generateReceiptId } from "../../payments/utils";
import { getUserById } from "@/firebase";
import { usePaymentApproval } from "../../payments/hooks/usePaymentApproval";
import { se } from "date-fns/locale";
import { getProofOfPaymentById } from "@/firebase/payment/read/proofOfPayment";
import { getActiveTerm } from "@/firebase/term";

export const useFeeAction = (onSuccess?: (feeId: string) => void) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [receiptOpen, setReceiptOpen] = useState(false)
    const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)

    const { _approvePayment, _rejectPayment } = usePaymentApproval();

    const { user } = useAuth();
    const userId = user?.uid;

    const addManualPayment = async (feeId: string, amount: string, method: "gcash" | "cash" | "bank_transfer" | "waiver", ref?: string, senderNumber?: string) => {
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        const feeData = await fetchFee(feeId);
        if (!feeData) {
            throw new Error("Fee not found");
        }

        try {
            const receipt = generateReceiptId();
            await recordManualPaymentAndUpdateClearance(feeId, amount, method, userId || "", feeData.userId, user?.firstName + " " + user?.lastName || "",ref, receipt, senderNumber)
            setSuccess(true);
            toast.success("Payment recorded successfully!");
            const fee = await fetchFee(feeId);
            if (fee) {
                const term = await getActiveTerm();
                const user = await getUserById(fee.userId || "");
                const currentUser = await getUserById(userId || "");
                    setReceiptData({
                        receiptId: receipt,
                        studentName: user?.firstName + " " + user?.lastName || "",
                        studentId: user?.studentId || "",
                        items: [{
                            name: fee.title,
                            type: "fees",
                            amount: fee.amount,
                            }],
                        total: parseFloat(amount),
                        date:  new Date().toLocaleString(),
                        verifiedByName: currentUser?.firstName + " " + currentUser?.lastName || "",
                        paymentMethod: method,
                        AY: term!.AY,
                        semester: term!.semester,
                    }); 
                setReceiptOpen(true);
            }
            
            onSuccess?.(feeId);
        } catch (err) {
            setError("Failed to perform action");
            toast.error("Failed to record payment");
        } finally {
            setIsSubmitting(false);
        }
    };

    const approvePayment = async (proofId: string) => {
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        try {
            const proof = await getProofOfPaymentById(proofId);
            if (proof) {
                const result = await _approvePayment(proof);
                setSuccess(true);
                toast.success("Payment approved successfully!");
                setReceiptData(result?.receipt! as ReceiptData);
                setReceiptOpen(true);
                onSuccess?.(proof.referenceId);
            }else{
                toast.error("Proof of payment not found, please try again or contact the developer");
                throw new Error("Proof of payment not found");
            }

        } catch (err) {
            console.error(err);
            setError("Failed to perform action");
            toast.error("Failed to approve payment");
        } finally {
            setIsSubmitting(false);
        }
    };

    const rejectPayment = async (proofId:string, reason: string) => {
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        try {
            const proof = await getProofOfPaymentById(proofId);
            if (proof) {
                await _rejectPayment(proof, reason);
                setSuccess(true);
                toast.success("Payment rejected successfully!");
                onSuccess?.(proof.referenceId);
            } else {
                toast.error("Proof of payment not found, please try again or contact the developer");
                throw new Error("Proof of payment not found");
            }
        } catch (err) {
            console.error(err);
            setError("Failed to perform action");
            toast.error("Failed to reject payment");
        } finally {
            setIsSubmitting(false);
        }
    };

    const archiveFee = async (feeItemId: string) => {
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        try {
            await archiveFeeDocuments(feeItemId);
            setSuccess(true);
            toast.success("Fee archived successfully!");
            onSuccess?.(feeItemId);
        } catch (err) {
            setError("Failed to perform action");
            toast.error("Failed to archive fee");
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
        archiveFee,
        setReceiptOpen,
        receiptData,
        receiptOpen,
    };
}
