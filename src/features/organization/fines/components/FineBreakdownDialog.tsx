import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Banknote, AlertTriangle, XIcon, CalendarIcon, ClockIcon, UserIcon, ShieldCheckIcon, MessageSquareIcon, CheckIcon, Eye, PenLine } from "lucide-react";
import { appealStatusConfig } from "../config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FineItem, FinesPaymentLog, StudentFines } from "../types";
import { useEffect, useState } from "react";
import { getFineItemsByFineId } from "@/firebase/fines/read/fines";
import { FineItemDetailDialog } from "./FineItemDetailDialog";
import { getPaymentHistoriesByReferenceId } from "@/firebase/payment/read/paymentHistory";
import { computeTotalPaid } from "../utils/fineComputations";
import { ManualPaymentDialog } from "./ManualPaymentDialog";
import { PaymentType } from "@/constants/types";


interface FineBreakdownDialogProps { 
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fines: StudentFines | null;
    onSuccess?: (fines:StudentFines) => void;
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
    
  
  const fetchFineItems = async (fineId: string) => {
  const fineItems = await getFineItemsByFineId(fineId);
  const allPaymentLogs = await getPaymentHistoriesByReferenceId(fineId, PaymentType.FINES);

  const pendingAppeals = fineItems.filter(item => item.appealStatus === "pending");
  const verified = allPaymentLogs.filter(pl => pl.status === "verified");
  const rejected = allPaymentLogs.filter(pl => pl.status === "rejected");

  setFineItems(fineItems);
  setPendingAppealItems(pendingAppeals);
  setPaymentLogs(allPaymentLogs);
  setVerifiedPayments(verified);
    setRejectedPayments(rejected);
  setTotalPaid(computeTotalPaid(verified));
};

    const openFineDetail = (item: FineItem) => {
        if (item) {
            setSelectedItem(item);
            setItemOpen(true);
        }
    }
    
    const getVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "outline";
      case "partial":
        return "outline";
      case "paid":
        return "secondary";
      case "waived":
        return "outline";
      case "unpaid":
        return "destructive";
      default:
        return "outline";
    }
    }

    const cfg = getVariant(fines?.status ?? "unpaid");
    
    useEffect(() => {
        if (fines && open) {
            fetchFineItems(fines.id!);
        }
    }, [open, fines]);
  
  const handlePaymentSucceed = () => {
    onSuccess && onSuccess(fines!);
    onOpenChange(false);
  }

    return (
        <div>
            
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fine Breakdown — {fines?.userName}</DialogTitle>
            <DialogDescription>
              {fines?.studentId} · {fines?.fineItemsCount} fine item(s)
            </DialogDescription>
          </DialogHeader>
          
            <div className="flex flex-col gap-2.5 rounded-md border border-border bg-muted/30 px-4 py-3">
            {/* Header row */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                <Banknote className="size-4 shrink-0 text-muted-foreground" />
                <span className="text-sm font-semibold">Payment Submissions</span>
                <Badge variant={cfg}>
                    {fines?.status}
                </Badge>
                </div>
                {fines?.status === "pending" && (
                <Button size="sm" variant="outline" onClick={() => setPaymentOpen(true)}>
                    Review Payment
                </Button>
                )}
            </div>
                {fineItems.length > 0 && paymentLogs.length >0 && (
                  <p className="text-xs text-muted-foreground">
                    This submission covers{" "}
                    <span className="font-medium text-foreground">
                      {fineItems.length} fine item{fineItems.length !== 1 ? "s" : ""}
                    </span>
                    {" — "}
                    {fineItems.map((i, idx) => (
                      <span key={i.id}>
                        {i.fineTypeName}{i.eventName ? ` (${i.eventName})` : ""}
                        {idx < fineItems.length - 1 ? ", " : ""}
                      </span>
                    ))}
                    {" — totalling "}
                    <span className="font-medium text-foreground">₱{totalPaid.toLocaleString()}</span>.
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
                  <div className="flex items-start gap-2 rounded-sm border border-destructive/20 bg-destructive/10 px-3 py-2">
                    <XIcon className="size-3.5 mt-0.5 shrink-0 text-destructive" />
                    <p className="text-xs text-destructive leading-relaxed">{rejectedPayments[0].rejectionReason}</p>
                  </div>
                )}
            </div>
            
                    
          <div className="flex flex-col gap-3">
            {fineItems.map(item => {
              const statusColor = item.isWaived
                ? "border-muted bg-muted/30"
                : "border-border bg-card"
              return (
                <div
                  key={item.id}
                  className={`rounded-lg border p-4 flex flex-col gap-3 transition-colors ${statusColor}`}
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-muted-foreground tabular-nums">
                        #{item.itemNumber}
                      </span>
                      {/* <Badge variant="outline" className="font-mono text-xs py-0">
                        {item.fineTypeCode}
                      </Badge> */}
                      {item.isWaived && (
                        <Badge variant="outline" className="text-xs py-0 text-muted-foreground">
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
                        item.isWaived ? "text-muted-foreground line-through" : "text-foreground"
                      }`}
                    >
                      ₱{item.amount.toLocaleString()}
                    </span>
                  </div>

                  {/* Fine type name */}
                  <p className="text-sm font-semibold text-foreground leading-snug">
                    {item.fineTypeName}
                  </p>

                  {/* Meta row */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                    {item.eventName && (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarIcon className="size-3 shrink-0" />
                        {item.eventName}
                        {item.eventDate && <span className="opacity-60">· {item.eventDate.toDate().toLocaleDateString()}</span>}
                      </span>
                    )}
                    {/* {item.timeViolation && (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ClockIcon className="size-3 shrink-0" />
                        {item.timeViolation}
                      </span>
                    )} */}
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <UserIcon className="size-3 shrink-0" />
                      Issued by {item.issuedBy} · {item.issuedAt.toDate().toLocaleDateString()}
                    </span>
                  </div>

                  {/* Reason */}
                  <p className="text-xs text-muted-foreground border-t border-border pt-2.5">
                    {item.reason}
                  </p>

                  {/* Waiver note */}
                  {item.isWaived && item.waivedReason && (
                    <div className="flex flex-col gap-2.5 rounded-md border border-border bg-muted/40 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheckIcon className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="text-xs font-semibold text-foreground">Fine Waived</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed pl-5.5">
                        {item.waivedReason}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 pl-5.5">
                        {item.waivedBy && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <UserIcon className="size-3 shrink-0" />
                            Waived by {item.waivedBy}
                          </span>
                        )}
                        {item.waivedAt && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <CalendarIcon className="size-3 shrink-0" />
                            {item.waivedAt.toDate().toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Appeal note */}
                  {item.appealNotes && (
                    <div className="flex flex-col gap-3 rounded-md border border-border bg-muted/40 px-4 py-3">
                      {/* Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <MessageSquareIcon className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="text-xs font-semibold text-foreground">Student Appeal</span>
                        </div>
                        <Badge
                          variant={appealStatusConfig[item.appealStatus!].variant}
                          className="text-xs"
                        >
                          {appealStatusConfig[item.appealStatus!].label}
                        </Badge>
                      </div>

                      {/* Appeal notes in a blockquote-style indent */}
                      <blockquote className="border-l-2 border-muted-foreground/30 pl-3">
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.appealNotes}</p>
                      </blockquote>

                      {/* Meta row */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <CalendarIcon className="size-3 shrink-0" />
                          Submitted {item.appealedAt?.toDate().toLocaleDateString()}
                        </span>
                        {item.appealResolvedBy && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <UserIcon className="size-3 shrink-0" />
                            Resolved by {item.appealResolvedBy} · {item.appealResolvedAt?.toDate().toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Rejection reason callout */}
                      {/* {item.appealStatus === "rejected" && item.rejectionReason && (
                        <div className="flex items-start gap-2 rounded-sm border border-destructive/20 bg-destructive/10 px-3 py-2">
                          <XIcon className="size-3.5 mt-0.5 shrink-0 text-destructive" />
                          <p className="text-xs text-destructive leading-relaxed">
                            {item.appeal.rejectionReason}
                          </p>
                        </div>
                      )} */}

                      {/* Accept / Reject actions — only for pending appeals */}
                      {/* {item.appealStatus === "pending" && (
                        <>
                          <Separator />
                          {rejectingAppealItemId === item.id ? (
                            <div className="flex flex-col gap-2">
                              <p className="text-xs font-medium text-foreground">Rejection reason</p>
                              <Textarea
                                rows={3}
                                placeholder="Explain why the appeal is being rejected…"
                                value={appealRejectReason}
                                onChange={e => setAppealRejectReason(e.target.value)}
                                className="text-xs resize-none"
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs"
                                  onClick={() => {
                                    setRejectingAppealItemId(null)
                                    setAppealRejectReason("")
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8 text-xs gap-1.5"
                                  onClick={() => handleRejectAppeal(item.id, appealRejectReason)}
                                >
                                  <XIcon className="size-3.5" />
                                  Confirm Reject
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs gap-1.5 border-green-500/40 text-green-700 hover:bg-green-50 hover:text-green-800 dark:text-green-400 dark:border-green-500/30 dark:hover:bg-green-950"
                                onClick={() => handleAcceptAppeal(item.id)}
                              >
                                <CheckIcon className="size-3.5" />
                                Accept Appeal
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  setRejectingAppealItemId(item.id)
                                  setAppealRejectReason("")
                                }}
                              >
                                <XIcon className="size-3.5" />
                                Reject Appeal
                              </Button>
                            </div>
                          )}
                        </>
                      )} */}
                    </div>
                  )}

                  {/* Pending bulk payment indicator — shown when this fine is covered by an unreviewed submission */}
                  {!item.isWaived && verifiedPayments[0]?.status === "pending" && (() => {
                    const bps = verifiedPayments[0];
                    return (
                      <div className="flex items-start gap-2 rounded-sm border border-border bg-muted/50 px-3 py-2">
                        <Banknote className="size-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                        <div className="flex flex-col gap-0.5">
                          <p className="text-xs font-medium text-foreground">Included in pending bulk payment</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            This fine is part of a{" "}
                            <span className="font-medium text-foreground">
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
                    className="self-end gap-1.5 text-xs h-8"
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
                {fineItems && (
                    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3 mt-1">
                    <span className="text-sm font-medium text-muted-foreground">
                        Total outstanding ({fineItems.filter(i => !i.isWaived).length} fine{fineItems.filter(i => !i.isWaived).length !== 1 ? "s" : ""})
                    </span>
                    <span className="text-base font-bold text-foreground">
                        ₱{fines?.accumulatedAmount.toLocaleString()}
                    </span>
                    </div>
                )}

                {/* Manual payment action */}
                {fines && fines.balance > 0 && paymentLogs.length === 0 && (
                    <div className="flex justify-end mt-2">
                    <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 border-green-500/40 text-green-700 hover:bg-green-50 hover:text-green-800 dark:text-green-400 dark:border-green-500/30 dark:hover:bg-green-950"
                        onClick={() => setManualPayOpen(true)}
                    >
                        <PenLine className="size-3.5" />
                        Log Manual Payment
                    </Button>
                    </div>
                )}   
            {selectedItem && (<FineItemDetailDialog 
              open={itemOpen} 
              onOpenChange={(open) => setItemOpen(open)} 
              fineItem={selectedItem!}
            />)}
            
            <ManualPaymentDialog
              open={manualPayOpen}
              onOpenChange={(open) => setManualPayOpen(open)}
              fines={fines!}
              fineItems={fineItems}
              onSuccess={() => handlePaymentSucceed()}
            />
        
            
        </DialogContent>
        </Dialog>
        </div>
        
    );
}
