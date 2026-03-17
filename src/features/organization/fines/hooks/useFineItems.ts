import { useEffect, useState } from "react";
import { FineItem, ProofOfPayment, StudentFines } from "../types";
import { getFinesPaymentHistoriesByReferenceId } from "@/firebase/payment/read/paymentHistory";
import { getProofOfPaymentById } from "@/firebase/payment/read/proofOfPayment";
import { getFineItemsByIds } from "@/firebase/fines/read/fines";

export const useFineItems = (fines: StudentFines) =>{
    const [pendingPayment, setPendingPayment] = useState<ProofOfPayment>();
    const [paymentCoveredFineItems, setPaymentCoveredFineItems] = useState<FineItem[]>([]);
    const [totalPending, setTotalPending] = useState(0);

    const getFinesCoveredOnPayment = async () => {
        const paymentLog = await getFinesPaymentHistoriesByReferenceId(fines.id!)
        paymentLog.filter((pmnt) => { pmnt.status === "pending" });
        
        if (paymentLog) {
            const payment = await getProofOfPaymentById(paymentLog[0].paymentProofId!);
            if (payment) {
                setPendingPayment(payment);

                const fineItemsId:string[] = []
                const items = payment.metadata.items;
                let totalToPay = 0;
                items?.forEach((i) => {
                    if (i.parentFineId === fines.id) {
                        fineItemsId.push(i.refId);
                        totalToPay += i.amount;
                    }
                })  
                const fineItems = await getFineItemsByIds(fines.id!, fineItemsId)
                setPaymentCoveredFineItems(fineItems);
                setTotalPending(totalToPay);
            }
        

        }
    }

    useEffect(() => {
        if(fines && fines.status === "pending")getFinesCoveredOnPayment();
    }, [fines]);
    
    return {
        pendingPayment,
        paymentCoveredFineItems,
        totalPending
    }

}