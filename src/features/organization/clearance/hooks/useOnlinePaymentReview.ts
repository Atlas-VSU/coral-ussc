import { useEffect, useState, useCallback } from "react";
import { ProofOfPayment } from "../../fines/types";
import { ClearanceStatus } from "../types";
import { getPendingProofOfPaymentsByUserId } from "@/firebase/payment/read/proofOfPayment";

export function useOnlinePaymentReview(clearance: ClearanceStatus) {
    const [pendingPayments, setPendingPayments] = useState<ProofOfPayment[]>([]);
    const [loading, setLoading] = useState(true);

    const getPendingPayments = useCallback(async () => {
        setLoading(true);
        try {
            const payment = await getPendingProofOfPaymentsByUserId(
                clearance.userId, 
                clearance.orgId
            );
            setPendingPayments(payment ? payment : []);
        } catch (error) {
            console.error("Failed to fetch pending payments:", error);
            setPendingPayments([]);
        } finally {
            setLoading(false);
        }
    }, [clearance.userId, clearance.orgId]); 

    useEffect(() => { 
        getPendingPayments(); 
    }, [getPendingPayments]);

    return { 
        pendingPayments, 
        getPendingPayments, 
        loading 
    };
}