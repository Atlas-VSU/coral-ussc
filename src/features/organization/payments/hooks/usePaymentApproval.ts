import { rejectPaymentProof, verifyPaymentProof } from "@/firebase/payment/update/proofOfPayment"
import { FineItem, ProofOfPayment } from "../../fines/types"
import { generateReceiptId } from "../utils"
import { getPendingPaymentHistory } from "@/firebase/payment/read/paymentHistory"
import { getCurrentUserData, searchUserByStudentId } from "@/firebase/users"
import { Member } from "../../members/types"
import { rejectPaymentHistory, verifyPaymentHistory } from "@/firebase/payment/update/paymentHistory"
import { markFineItemsAsNotPending, markFineItemsAsPaid } from "@/firebase/fines/update/fineItemsStatus"
import { toast } from "sonner"
import { ReceiptData } from "@/components/organization/receipt/PaymentReceiptDialog"
import { Timestamp } from "firebase/firestore"
import { recalculateClearanceStatus } from "@/firebase"
import { recalculateFines } from "@/firebase/fines/update/recalculate"
import { recalculateFees } from "@/firebase/fees/update/recalculate"
import { cacheService, CACHE_KEYS } from "@/services/cacheService"
import { updateFeeStats, updateFineStats } from "@/firebase/stats/update/updateStats"


export const usePaymentApproval = () => {

    const _approvePayment = async (payment: ProofOfPayment) => {
        try {
            const verifier = await getCurrentUserData() as unknown as Member;
            const paymentOwner = await searchUserByStudentId(payment.studentId);
            if (paymentOwner === null) {
                toast.error("Payment owner not found, cannot verify payment.")
                return;
            };
            const receipt = generateReceiptId();
            verifyPaymentProof(payment, verifier, receipt);
            if (payment.metadata.items?.length) {

                const items = payment.metadata.items;
                let parentFine = "";
                let fineItemIds: string[] = [];
                let totalFine = 0;

                for (const item of items) {
                    if (item.paymentType === "fees") {
                        await verifyPaymentHistory(item.historyId!, verifier, "fees", item.refId, item.amount);
                        await updateFeeStats("2ndSem-2025-2026", 0, item.amount);
                    }
                    if (item.paymentType === "fines") {
                        parentFine = item.parentFineId;
                        fineItemIds.push(item.refId);
                        totalFine += item.amount;
                        await markFineItemsAsPaid(item.parentFineId, item.refId);
                    }
                }
                if (parentFine !== "") {
                    const paymentHistory = await getPendingPaymentHistory(parentFine, "fines", payment.id!);
                    await verifyPaymentHistory(paymentHistory!.id, verifier, "fines", parentFine, totalFine, null, fineItemIds);
                    await updateFineStats("2ndSem-2025-2026", 0, totalFine);
                }
                await recalculateClearanceStatus(paymentOwner.id!);
                
                // Invalidate proof-of-payment cache for the owner
                cacheService.invalidate(CACHE_KEYS.proofOfPaymentByUser(paymentOwner.id!, payment.orgId));

                const newReceiptData: ReceiptData = {

                    receiptId: receipt,
                    studentName: payment.userName,
                    studentId: payment.studentId,
                    items: items.map(d => ({ name: d.title, type: d.paymentType as "fees" | "fines", amount: d.amount })),
                    total: payment.amount,
                    date: Timestamp.now().toDate().toLocaleString(),
                    verifiedByName: verifier.firstName + " " + verifier.lastName,
                    paymentMethod: payment.paymentMethod,
                };

                return {
                    success: true,
                    receipt: newReceiptData,
                }
            }
        } catch (error) {
            console.error("Failed payment approval.", error)
            toast.error("Failed payment approval, please contact the developer")
            
        }
    }

    const _rejectPayment = async (payment: ProofOfPayment, reason: string) => {
        try {
            const verifier = await getCurrentUserData() as unknown as Member;
            const paymentOwner = await searchUserByStudentId(payment.studentId);
            if (paymentOwner === null) {
                toast.error("Payment owner not found, cannot verify payment.")
                return;
            };
            rejectPaymentProof(payment, verifier, reason);
            if (payment.metadata.items?.length) {

                const items = payment.metadata.items;
                let parentFine = "";
                let fineItemIds: string[] = [];

                for (const item of items) {
                    if (item.paymentType === "fees") {
                        await rejectPaymentHistory(item.historyId!, verifier, "fees", item.refId, [], reason);
                        await recalculateFees(item.refId,0);
                    }

                    if (item.paymentType === "fines") {
                        parentFine = item.parentFineId;
                        fineItemIds.push(item.refId);                   
                    }
                }
                if (parentFine !== "") {
                    const paymentHistory = await getPendingPaymentHistory(parentFine, "fines",payment.id!);
                    await rejectPaymentHistory(paymentHistory!.id, verifier, "fines", parentFine, fineItemIds, reason);
                    await markFineItemsAsNotPending(parentFine, fineItemIds);
                    await recalculateFines(parentFine,0);
                }
                await recalculateClearanceStatus(paymentOwner.id!);
                
                // Invalidate proof-of-payment cache for the owner
                cacheService.invalidate(CACHE_KEYS.proofOfPaymentByUser(paymentOwner.id!, payment.orgId));

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