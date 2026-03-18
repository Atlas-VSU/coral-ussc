import { useEffect, useState, useCallback } from "react";
import { FineItem, ProofOfPayment, StudentFines } from "../types";
import { getFinesPaymentHistoriesByReferenceId } from "@/firebase/payment/read/paymentHistory";
import { getProofOfPaymentById } from "@/firebase/payment/read/proofOfPayment";
import { getFineItemsByIds } from "@/firebase/fines/read/fines";

export const useFineItems = (fines: StudentFines) => {
    const [pendingPayment, setPendingPayment] = useState<ProofOfPayment>();
    const [paymentCoveredFineItems, setPaymentCoveredFineItems] = useState<FineItem[]>([]);
    const [totalPending, setTotalPending] = useState(0);

    const getFinesCoveredOnPayment = useCallback(async () => {
        if (!fines?.id) return;

        try {
            const paymentLog = await getFinesPaymentHistoriesByReferenceId(fines.id);
            
            const pendingLogs = paymentLog.filter((pmnt) => pmnt.status === "pending");
            
            if (pendingLogs.length > 0) {
                const firstPendingLog = pendingLogs[0];
                
                if (firstPendingLog.paymentProofId) {
                    const payment = await getProofOfPaymentById(firstPendingLog.paymentProofId);
                    
                    if (payment) {
                        setPendingPayment(payment);

                        const fineItemsId: string[] = [];
                        let totalToPay = 0;
                        const items = payment.metadata?.items || [];

                        items.forEach((i) => {
                            if (i.parentFineId === fines.id) {
                                fineItemsId.push(i.refId);
                                totalToPay += i.amount;
                            }
                        });

                        if (fineItemsId.length > 0) {
                            const fineItems = await getFineItemsByIds(fines.id, fineItemsId);
                            setPaymentCoveredFineItems(fineItems);
                        } else {
                            setPaymentCoveredFineItems([]);
                        }
                        
                        setTotalPending(totalToPay);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching fines covered on payment:", error);
        }
    }, [fines?.id]);

    useEffect(() => {

            getFinesCoveredOnPayment();

    }, [fines?.status, getFinesCoveredOnPayment]);
    
    return {
        pendingPayment,
        paymentCoveredFineItems,
        totalPending,
        getFinesCoveredOnPayment
    };
};