import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../local-components/dialog";
import { Banknote, AlertTriangle, XIcon, CalendarIcon, UserIcon, ShieldCheckIcon, MessageSquareIcon, Eye, PenLine } from "lucide-react";
import { appealStatusConfig } from "../config";
import { Badge } from "@/components/ui/badge";
import { Button } from "../local-components/button";
import { FineItem, FinesPaymentLog, ProofOfPayment, StudentFines } from "../types";
import { useEffect, useState, useCallback } from "react";
import { getFineItemsByFineId } from "@/firebase/fines/read/fines";
import { FineItemDetailDialog } from "./FineItemDetailDialog";
import { getFinesPaymentHistoriesByReferenceId} from "@/firebase/payment/read/paymentHistory";
import { computeTotalPaid } from "../utils/fineComputations";
import { ManualPaymentDialog } from "./ManualPaymentDialog";
import { PaymentReviewDialog } from "../local-components/PaymentReviewDialog";
import { useFineItems } from "../hooks/useFineItems";
import { usePaymentApproval } from "../../payments/hooks/usePaymentApproval";
import PaymentReceiptDialog, { ReceiptData } from "../local-components/PaymentReceiptDialog";
import { toast } from "sonner";

interface FineBreakdownDialogProps { 
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fines: StudentFines | null;
    onSuccess?: (fines: StudentFines) => void;
}

export function FineBreakdownDialog({ open, onOpenChange, fines, onSuccess }: FineBreakdownDialogProps) {

    const [paymentOpen, setPaymentOpen] = useState(false);
    const [itemOpen, setItemOpen] = useState(false);
    const [fineItems, setFineItems] = useState<FineItem[]>([]);
    const [pendingAppealItems, setPendingAppealItems] = useState<FineItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<FineItem>();
    const [paymentLogs, setPaymentLogs] = useState<FinesPaymentLog[]>([]);
    const [verifiedPayments, setVerifiedPayments] = useState<FinesPaymentLog[]>([]);
    const [rejectedPayments, setRejectedPayments] = useState<FinesPaymentLog[]>([]);
    const [manualPayOpen, setManualPayOpen] = useState(false);
    const [totalPaid, setTotalPaid] = useState(0);
    const [receiptOpen, setReceiptOpen] = useState(false);
    const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
    
    const {
        pendingPayment,
        paymentCoveredFineItems,
        totalPending,
    } = useFineItems(fines || ({} as StudentFines));
  
    const { _approvePayment, _rejectPayment } = usePaymentApproval();
    
    const fetchFineItems = useCallback(async (fineId: string) => {
        try {
            const fetchedFineItems = await getFineItemsByFineId(fineId);
            const allPaymentLogs = await getFinesPaymentHistoriesByReferenceId(fineId);
            

            const pendingAppeals = fetchedFineItems.filter(item => item.appealStatus === "pending");
            const verified = allPaymentLogs.filter(pl => pl.status === "verified");
            const rejected = allPaymentLogs.filter(pl => pl.status === "rejected");

            setFineItems(fetchedFineItems);
            setPendingAppealItems(pendingAppeals);
            setPaymentLogs(allPaymentLogs);
            setVerifiedPayments(verified);
            setRejectedPayments(rejected);
            setTotalPaid(computeTotalPaid(verified));
        } catch (error) {
            console.error("Failed to fetch fine items:", error);
        }
    }, []);

    const openFineDetail = (item: FineItem) => {
        if (item) {
            setSelectedItem(item);
            setItemOpen(true);
        }
    }
    
    const getVariant = (status: string) => {
        switch (status) {
            case "pending": return "outline";
            case "partial": return "outline";
            case "paid": return "secondary";
            case "waived": return "outline";
            case "unpaid": return "destructive";
            default: return "outline";
        }
    }

    const cfg = getVariant(fines?.status ?? "unpaid");
    
    useEffect(() => {
        if (fines?.id && open) {
            fetchFineItems(fines.id);
        }
    }, [open, fines?.id, fetchFineItems]); 
  
    const handlePaymentSucceed = async () => {
        if (onSuccess && fines) onSuccess(fines);
        onOpenChange(false);
    }

    const handleApprovalSucceed = async (payment: ProofOfPayment) => {
        try {
            const result = await _approvePayment(payment);
            const receipt = result?.receipt as ReceiptData;
            setReceiptData(receipt);
            setReceiptOpen(true);
            toast.success("A payment was logged successfully.");
        } catch (error) { 
            console.error("Payment approval failed:", error);
            toast.error("Failed to approve payment. Please try again or contact the developer.");
        }
    }

    const handleRejectSucceed = async (payment: ProofOfPayment, reason: string) => {
        try {
            await _rejectPayment(payment, reason);
            if (onSuccess && fines) onSuccess(fines);
            onOpenChange(false);
            toast.success("The payment was rejected.");
        } catch(error) {
            console.error("Payment rejection failed:", error);
            toast.error("Failed to reject payment. Please try again or contact the developer.");
        }
    }

    return (
        <div>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto !bg-white border-[#2E7D32]/30">
                    <DialogHeader>
                        <DialogTitle className="text-[#1B5E20] font-bold">Fine Breakdown — {fines?.userName}</DialogTitle>
                        <DialogDescription className="text-[#2E7D32]/70">
                            {fines?.studentId} · {fines?.fineItemsCount} fine item(s)
                        </DialogDescription>
                    </DialogHeader>
          
                    <div className="flex flex-col gap-2.5 rounded-md border border-[#2E7D32]/30 bg-[#AED581]/10 px-4 py-3">
                        {/* Header row */}
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <Banknote className="size-4 shrink-0 text-[#1B5E20]" />
                                <span className="text-sm font-semibold text-[#1B5E20]">Payment Submissions</span>
                                <Badge variant={cfg} className="bg-[#AED581]/30 text-[#1B5E20] border-[#2E7D32]/30 uppercase">
                                    {fines?.status}
                                </Badge>
                            </div>
                            {fines?.status === "pending" && (
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="border-[#2E7D32]/30 text-[#1B5E20] hover:bg-[#AED581]/20"
                                    onClick={() => setPaymentOpen(true)}
                                >
                                    Review Payment
                                </Button>
                            )}
                        </div>

                        {fineItems.length > 0 && paymentLogs.length > 0 && fines?.status !== "pending" &&(
                            <p className="text-xs text-[#2E7D32]">
                                The submission covers{" "}
                                <span className="font-medium text-[#1B5E20]">
                                    {(fineItems.filter(item => item.isPaid)).length.toLocaleString()} fine item{fineItems.filter(item => item.isPaid).length !== 1 ? "s" : ""}
                                </span>
                                {" — "}
                                {(fineItems.filter(item => item.isPaid)).map((i, idx) => (
                                    <span key={i.id} className="text-[#1B5E20]">
                                        {i.fineTypeName}{i.eventName ? ` (${i.eventName})` : ""}
                                        {idx < fineItems.filter(item => item.isPaid).length - 1 ? ", " : ""}
                                    </span>
                                ))}
                                {" — totalling "}
                                <span className="font-medium text-[#1B5E20]">₱{totalPaid.toLocaleString()}</span>.
                            </p>
                        )}
              

                        {/* Soft advisory when pending appeals exist alongside a pending payment */}
                        {fines?.status === "pending" && pendingAppealItems.length > 0 && (
                            <div className="flex items-start gap-2 rounded-sm border border-amber-400/30 bg-amber-50 dark:bg-amber-950/30 px-3 py-2">
                                <AlertTriangle className="size-3.5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                                    <span className="font-semibold">
                                        {pendingAppealItems.length} fine item{pendingAppealItems.length !== 1 ? "s" : ""} in this payment
                                        {pendingAppealItems.length !== 1 ? " have" : " has"} an unresolved appeal.
                                    </span>
                                    {" "}Approving this payment will settle all covered fines regardless of appeal outcome.
                                    Consider resolving pending appeals first, or approve if the amount has been confirmed.
                                </p>
                            </div>
                        )}
                        
                        {/* Declined rejection reason */}
                        {rejectedPayments[0] && rejectedPayments[0].rejectionReason && (
                            <div className="flex items-start gap-2 rounded-sm border border-red-300/30 bg-red-50/50 px-3 py-2">
                                <XIcon className="size-3.5 mt-0.5 shrink-0 text-red-600" />
                                <p className="text-xs text-red-700 leading-relaxed">{rejectedPayments[0].rejectionReason}</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex flex-col gap-3">
                        {fineItems.map(item => {
                            const statusColor = item.isWaived
                                ? "border-[#2E7D32]/30 bg-[#AED581]/10"
                                : "border-[#2E7D32]/30 bg-white"
                            return (
                                <div
                                    key={item.id}
                                    className={`rounded-lg border p-4 flex flex-col gap-3 transition-colors ${statusColor}`}
                                >
                                    {/* Header row */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                                            <span className="text-xs font-bold text-[#1B5E20] tabular-nums">
                                                #{item.itemNumber}
                                            </span>
                                            <Badge variant="outline" className="uppercase font-mono text-xs py-0 border-[#2E7D32]/30 text-[#1B5E20]">
                                                {item.isPaid ? "Paid" : "Unpaid"}
                                            </Badge>
                                            {item.isWaived && (
                                                <Badge variant="outline" className="text-xs py-0 text-[#1B5E20] border-[#2E7D32]/30">
                                                    Waived
                                                </Badge>
                                            )}
                                            {item.appealNotes && (
                                                <Badge
                                                    variant={getVariant(fines?.status ?? "unpaid")}
                                                    className="text-xs py-0"
                                                >
                                                    Appeal: {fines?.status}
                                                </Badge>
                                            )}
                                        </div>
                                        <span
                                            className={`text-base font-bold shrink-0 ${
                                                item.isWaived ? "text-[#2E7D32]/70 line-through" : "text-[#1B5E20]"
                                            }`}
                                        >
                                            ₱{item.amount.toLocaleString()}
                                        </span>
                                    </div>

                                    {/* Fine type name */}
                                    <p className="text-sm font-semibold text-[#1B5E20] leading-snug">
                                        {item.fineTypeName}
                                    </p>

                                    {/* Meta row */}
                                    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                                        {item.eventName && (
                                            <span className="flex items-center gap-1.5 text-xs !text-[#103712]">
                                                <CalendarIcon className="size-3 shrink-0" />
                                                {item.eventName}
                                                {item.eventDate && <span className="">· {item.eventDate.toDate().toLocaleDateString()}</span>}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1.5 text-xs text-[#103712]">
                                            <UserIcon className="size-3 shrink-0" />
                                            Issued by {item.issuedBy} · {item.issuedAt.toDate().toLocaleDateString()}
                                        </span>
                                    </div>

                                    {/* Reason */}
                                    <p className="text-xs text-[#103712] border-t border-[#2E7D32]/30 pt-2.5">
                                        {item.reason}
                                    </p>

                                    {/* Waiver note */}
                                    {item.isWaived && item.waivedReason && (
                                        <div className="flex flex-col gap-2.5 rounded-md border border-[#2E7D32]/30 bg-[#AED581]/10 px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <ShieldCheckIcon className="size-3.5 shrink-0 text-[#1B5E20]" />
                                                <span className="text-xs font-semibold text-[#1B5E20]">Fine Waived</span>
                                            </div>
                                            <p className="text-xs text-[#2E7D32]/70 leading-relaxed pl-5.5">
                                                {item.waivedReason}
                                            </p>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 pl-5.5">
                                                {item.waivedBy && (
                                                    <span className="flex items-center gap-1 text-[11px] text-[#2E7D32]/70">
                                                        <UserIcon className="size-3 shrink-0" />
                                                        Waived by {item.waivedBy}
                                                    </span>
                                                )}
                                                {item.waivedAt && (
                                                    <span className="flex items-center gap-1 text-[11px] text-[#2E7D32]/70">
                                                        <CalendarIcon className="size-3 shrink-0" />
                                                        {item.waivedAt.toDate().toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Appeal note */}
                                    {item.appealNotes && (
                                        <div className="flex flex-col gap-3 rounded-md border border-[#2E7D32]/30 bg-[#AED581]/10 px-4 py-3">
                                            {/* Header */}
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <MessageSquareIcon className="size-3.5 shrink-0 text-[#1B5E20]" />
                                                    <span className="text-xs font-semibold text-[#1B5E20]">Student Appeal</span>
                                                </div>
                                                <Badge
                                                    variant={appealStatusConfig[item.appealStatus!].variant}
                                                    className="text-xs"
                                                >
                                                    {appealStatusConfig[item.appealStatus!].label}
                                                </Badge>
                                            </div>

                                            {/* Appeal notes in a blockquote-style indent */}
                                            <blockquote className="border-l-2 border-[#2E7D32]/30 pl-3">
                                                <p className="text-xs text-[#2E7D32]/70 leading-relaxed">{item.appealNotes}</p>
                                            </blockquote>

                                            {/* Meta row */}
                                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                                                <span className="flex items-center gap-1 text-[11px] text-[#2E7D32]/70">
                                                    <CalendarIcon className="size-3 shrink-0" />
                                                    Submitted {item.appealedAt?.toDate().toLocaleDateString()}
                                                </span>
                                                {item.appealResolvedBy && (
                                                    <span className="flex items-center gap-1 text-[11px] text-[#2E7D32]/70">
                                                        <UserIcon className="size-3 shrink-0" />
                                                        Resolved by {item.appealResolvedBy} · {item.appealResolvedAt?.toDate().toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Pending bulk payment indicator */}
                                    {!item.isWaived && verifiedPayments[0]?.status === "pending" && (() => {
                                        const bps = verifiedPayments[0];
                                        return (
                                            <div className="flex items-start gap-2 rounded-sm border border-[#2E7D32]/30 bg-[#AED581]/10 px-3 py-2">
                                                <Banknote className="size-3.5 mt-0.5 shrink-0 text-[#1B5E20]" />
                                                <div className="flex flex-col gap-0.5">
                                                    <p className="text-xs font-medium text-[#1B5E20]">Included in pending bulk payment</p>
                                                    <p className="text-[11px] text-[#2E7D32]/70 leading-relaxed">
                                                        This fine is part of a{" "}
                                                        <span className="font-medium text-[#1B5E20]">
                                                            ₱{bps.amount.toLocaleString()} {bps.paymentMethod}
                                                        </span>{" "}
                                                        submission dated {bps.paidAt.toDate().toLocaleDateString()}
                                                        {bps.gcashReference ? ` · Ref: ${bps.gcashReference}` : ""}.
                                                        {" "}
                                                        {item.appealStatus === "pending"
                                                            ? "This fine also has an unresolved appeal — resolve the appeal first, or use \"Review Payment\" above to settle regardless."
                                                            : "Use \"Review Payment\" above to approve or decline the full submission."}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })()}

                                    {/* View details */}
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="self-end gap-1.5 text-xs h-8 !bg-[#95e969] border-[#2E7D32]/30 text-[#0c3b0f] !hover:bg-[#57871f]"
                                        onClick={() => openFineDetail(item)}
                                    >
                                        <Eye className="size-3.5" />
                                        View Full Details
                                    </Button>
                                </div>
                            )
                        })}
                    </div>
            
                    {/* Total row */}
                    {fineItems.length > 0 && (
                        <div className="flex items-center justify-between rounded-lg border border-[#2E7D32]/30 bg-[#AED581]/10 px-4 py-3 mt-1">
                            <span className="text-sm font-medium text-[#1B5E20]">
                                Total outstanding ({fineItems.filter(i => !i.isWaived && !i.isPaid).length} fine{fineItems.filter(i => !i.isWaived && !i.isPaid).length !== 1 ? "s" : ""})
                            </span>
                            <span className="text-base font-bold text-[#1B5E20]">
                                ₱{fines?.balance?.toLocaleString() || "0"}
                            </span>
                        </div>
                    )}

                    {/* Manual payment action */}
                    {fines && fines.balance > 0 && fines.status !== "pending" && (
                        <div className="flex justify-end mt-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 border-[#2E7D32]/30 text-[#1B5E20] hover:bg-[#AED581]/20"
                                onClick={() => setManualPayOpen(true)}
                            >
                                <PenLine className="size-3.5" />
                                Log Manual Payment
                            </Button>
                        </div>
                    )}   
                    
                    {selectedItem && (
                        <FineItemDetailDialog 
                            open={itemOpen} 
                            onOpenChange={(open) => setItemOpen(open)} 
                            fineItem={selectedItem}
                        />
                    )}

                    <PaymentReceiptDialog
                        open={receiptOpen}
                        onOpenChange={(v) => {
                            setReceiptOpen(v);
                            if (!v) {
                                if (onSuccess && fines) onSuccess(fines);
                                onOpenChange(false);
                            }
                        }}
                        data={receiptData}
                    />
            
                    {fines && (
                        <ManualPaymentDialog
                            open={manualPayOpen}
                            onOpenChange={(open) => setManualPayOpen(open)}
                            fines={fines}
                            fineItems={fineItems}
                            onSuccess={() => handlePaymentSucceed()}
                        />
                    )}
                    
                    <PaymentReviewDialog
                        open={paymentOpen}
                        onOpenChange={(open) => setPaymentOpen(open)}
                        data={pendingPayment ? {
                            studentName: fines?.userName || "",
                            studentId: fines?.studentId || "",
                            typeLabel: pendingPayment.paymentType?.toLocaleUpperCase() || "PAYMENT",
                            lineItems: paymentCoveredFineItems?.map(i => ({ 
                                label: i.eventName || "", 
                                sublabel: i.fineTypeName || "", 
                                amount: i.amount || 0, 
                                group: "fines" 
                            })) || [],
                            showLineItemsTotal: !!(paymentCoveredFineItems?.length),
                            amountPaid: pendingPayment.amount || 0,
                            referenceNo: pendingPayment.referenceNumber,
                            submittedAt: pendingPayment.submittedAt?.toDate().toLocaleDateString() || "",
                            receiptContent: pendingPayment.imageUrl,
                            declineRemarks: pendingPayment.rejectionReason,
                            reviewedBy: pendingPayment.verifiedByName,
                            reviewedAt: pendingPayment.verifiedAt?.toDate().toLocaleDateString() || "",
                            paymentMethod: pendingPayment.paymentMethod,
                        } : null}
                        onApprove={async () => {
                            if (pendingPayment) await handleApprovalSucceed(pendingPayment);
                        }}
                        onReject={async (reason) => {
                            if (pendingPayment) handleRejectSucceed(pendingPayment, reason);
                        }}
                    />
            
                </DialogContent>
            </Dialog>
        </div>
    );
}