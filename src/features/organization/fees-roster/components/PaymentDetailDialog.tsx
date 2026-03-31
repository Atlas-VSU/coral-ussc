"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { statusConfig, paymentMethodLabels } from "@/features/organization/fees/utils/statusConfig";
import type { Fee, PaymentLog } from "@/features/organization/fees/types";
import { Calendar, CreditCard, User, History, CheckCircle2, XCircle, Loader } from "lucide-react";
import { Separator } from "@radix-ui/react-separator";

interface PaymentDetailDialogProps {
  feeId: string;
  log: PaymentLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (feeId: string, logId: string) => void;
  onReject: (feeId: string, logId: string) => void;
  isSubmitting?: boolean;
}

export function PaymentDetailDialog({
  feeId,
  log,
  open,
  onOpenChange,
  onApprove,
  onReject,
  isSubmitting = false,
}: PaymentDetailDialogProps) {
  if (!log) return null;

  const config = statusConfig[log.status] || statusConfig.unpaid;
  const StatusIcon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border bg-white">
        <DialogHeader className="pb-2">
          <div className="flex items-center justify-between bg-white">
            <DialogTitle className="text-xl font-bold">Payment Details</DialogTitle>
            <Badge variant={config.variant} className="flex items-center gap-1">
              <StatusIcon className="size-3" /> {config.label}
            </Badge>
          </div>
          <DialogDescription>
            Please provide a reason for rejecting the payment submission from 
            <span className="font-semibold text-foreground italic ml-1">{(log as any).studentName || "this student"}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
            <User className="size-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Student</p>
              <p className="text-sm font-medium">{(log as any).studentName || "Unknown"}</p>
              <p className="text-xs font-mono text-muted-foreground">{(log as any).studentId || "N/A"}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CreditCard className="size-3" /> Method
              </div>
              <p className="text-sm font-medium">{paymentMethodLabels[log.paymentMethod] || log.paymentMethod}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="size-3" /> Date Paid
              </div>
              <p className="text-sm font-medium">
                {log.paidAt ? (log.paidAt.toDate ? log.paidAt.toDate().toLocaleDateString() : log.paidAt.toString()) : "—"}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-semibold">Amount Paid</p>
            <p className="text-2xl font-bold text-primary">₱{log.amount.toLocaleString()}</p>
          </div>

          {log.gcashReference && (
            <div className="space-y-1.5 p-3 rounded-lg border border-border bg-muted/20">
              <p className="text-xs text-muted-foreground font-medium">GCash Reference</p>
              <p className="text-sm font-mono font-semibold tracking-wider italic text-foreground uppercase">
                {log.gcashReference}
              </p>
            </div>
          )}

          {log.gcashReceiptImageUrl && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Payment Proof</p>
              <div className="aspect-video relative rounded-md border border-border bg-muted group">
                <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground font-medium italic">
                  Image placeholder: {log.gcashReceiptImageUrl}
                </div>
              </div>
            </div>
          )}

          {log.status === "rejected" && log.rejectionReason && (
            <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10">
              <p className="text-xs text-destructive font-semibold mb-1">Rejection Reason</p>
              <p className="text-sm text-foreground">{log.rejectionReason}</p>
            </div>
          )}
        </div>

        {log.status === "pending" && (
          <DialogFooter className="gap-2 sm:gap-0 font-medium">
            <Button 
              variant="outline" 
              className="flex-1 text-destructive hover:bg-destructive/10" 
              onClick={() => onReject(feeId, log.id)}
              disabled={isSubmitting}
            >
              <XCircle className="size-4 mr-1" /> Reject
            </Button>
            <Button 
              className="flex-1 bg-primary hover:bg-primary/90 gap-2" 
              onClick={() => onApprove(feeId, log.id)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              {isSubmitting ? "Approving..." : "Approve"}
            </Button>
          </DialogFooter>
        )}

        {log.status === "verified" && (
        <>
          <Separator />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Verified By</p>
              <p className="text-sm text-foreground">{log.verifiedByName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Verified At</p>
              <p className="text-sm text-foreground">{log.verifiedAt!.toDate().toLocaleDateString()}</p>
            </div>
          </div>
        </>
      )}

      </DialogContent>
    </Dialog>
  );
}
