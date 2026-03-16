import { rejectPaymentProof, verifyPaymentProof } from "@/firebase/payment/update/proofOfPayment"
import { FineItem, ProofOfPayment } from "../../fines/types"
import { generateReceiptId } from "../utils"
import { Fee } from "../../fees/types"
import { getPendingPaymentHistory } from "@/firebase/payment/read/paymentHistory"
import { getCurrentUserData } from "@/firebase/users"
import { Member } from "../../members/types"
import { rejectPaymentHistory, verifyPaymentHistory } from "@/firebase/payment/update/paymentHistory"
import { markFineItemsAsPaid } from "@/firebase/fines/update/fineItemsStatus"
import { toast } from "sonner"
import { ReceiptData } from "@/components/organization/PaymentReceiptDialog"
import { useState } from "react"
import { Timestamp } from "firebase/firestore"

export const usePaymentApproval = () => {
    const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)

    const _approvePayment = async (payment: ProofOfPayment) => {
        try {
            const verifier = await getCurrentUserData() as unknown as Member;
            const receipt = generateReceiptId();
            verifyPaymentProof(payment, verifier, receipt);
            if (payment.metadata.items?.length) {

                const items = payment.metadata.items;
                let parentFine = "";
                let totalFine = 0;

                for (const item of items) {
                    if (item.paymentType === "fees") {
                        const paymentHistory = await getPendingPaymentHistory(item.refId, "fees");
                        await verifyPaymentHistory(paymentHistory!.id, verifier, "fees", item.refId, item.amount);
                    }
                    if (item.paymentType === "fines") {
                        parentFine = item.parentFineId;
                        totalFine += item.amount;
                        await markFineItemsAsPaid(item.parentFineId, item.refId);
                    }
                }
                if (parentFine !== "") {
                    const paymentHistory = await getPendingPaymentHistory(parentFine, "fines");
                    await verifyPaymentHistory(paymentHistory!.id!, verifier, "fines", parentFine, totalFine);
                }
                    setReceiptData({
                        receiptId: receipt,
                        studentName: payment.userName,
                        studentId: payment.studentId,
                        items: items.map(d => ({ name: d.title, type: d.paymentType as "fees" | "fines", amount: d.amount })),
                        total: payment.amount,
                        date: Timestamp.now().toDate().toLocaleDateString(),
                        verifiedByName: verifier.firstName + " " + verifier.lastName,
                        paymentMethod: "Cash (Manual)",
                    })
                
                return {
                    success: true,
                    receipt: receiptData,
                }
            }

        } catch (error) {
            console.error("Failed payment approval.")
            toast.error("Failed payment approval, please contact the developer")
            
        }
    }



    const _rejectPayment = async (payment: ProofOfPayment, reason: string) => {
        try {
            const verifier = await getCurrentUserData() as unknown as Member;
            rejectPaymentProof(payment, verifier, reason);
            if (payment.metadata.items?.length) {

                const items = payment.metadata.items;
                let parentFine = "";

                for (const item of items) {
                    if (item.paymentType === "fees") {
                        const paymentHistory = await getPendingPaymentHistory(item.refId, "fees");
                        await rejectPaymentHistory(paymentHistory!.id, verifier, "fees", item.refId, reason);
                    }
                    if (item.paymentType === "fines") {
                        parentFine = item.parentFineId;
                    }
                }
                if (parentFine !== "") {
                    const paymentHistory = await getPendingPaymentHistory(parentFine, "fines");
                    await rejectPaymentHistory(paymentHistory!.id, verifier, "fines", parentFine, reason);
                }
                
                return {
                    success: true,
                    message: "Payment was rejected"
                }
            }

        } catch (error) {
            console.error("Error rejecting payment.")
            toast.error("Failed payment rejection, please contact the developer")
            
        }
    }



    return {
        _approvePayment,
        _rejectPayment
    }
}