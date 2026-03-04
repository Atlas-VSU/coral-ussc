"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { statusConfig, paymentMethodLabels } from "@/features/organization/fees/utils/statusConfig";
import type { Fee, PaymentLog } from "@/features/organization/fees/types";
import { Calendar, CreditCard, User, History, CheckCircle2, XCircle } from "lucide-react";

interface PaymentDetailDialogProps {
  fee: Fee;
  log: PaymentLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (id: string) => void;
  onReject: () => void;
}

export function PaymentDetailDialog({
  fee,
  log,
  open,
  onOpenChange,
  onApprove,
  onReject,
}: PaymentDetailDialogProps) {
  if (!log) return null;

  const config = statusConfig[log.status] || statusConfig.unpaid;
  const StatusIcon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border bg-background">
        <DialogHeader className="pb-2">
          <div className="flex items-center justify-between">
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
              <p className="text-sm font-medium">{paymentMethodLabels[log.payment_method] || log.payment_method}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="size-3" /> Date Paid
              </div>
              <p className="text-sm font-medium">
                {log.paid_at ? (log.paid_at.toDate ? log.paid_at.toDate().toLocaleDateString() : log.paid_at.toString()) : "—"}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-semibold">Amount Paid</p>
            <p className="text-2xl font-bold text-primary">₱{log.amount.toLocaleString()}</p>
          </div>

          {log.gcash_reference && (
            <div className="space-y-1.5 p-3 rounded-lg border border-border bg-muted/20">
              <p className="text-xs text-muted-foreground font-medium">GCash Reference</p>
              <p className="text-sm font-mono font-semibold tracking-wider italic text-foreground uppercase">
                {log.gcash_reference}
              </p>
            </div>
          )}

          {log.payment_proof_id && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Payment Proof</p>
              <div className="aspect-video relative rounded-md border border-border overflow-hidden bg-muted group">
                <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground font-medium italic">
                  Image placeholder: {log.payment_proof_id}
                </div>
              </div>
            </div>
          )}

          {log.status === "rejected" && log.rejection_reason && (
            <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10">
              <p className="text-xs text-destructive font-semibold mb-1">Rejection Reason</p>
              <p className="text-sm text-foreground">{log.rejection_reason}</p>
            </div>
          )}
        </div>

        {log.status === "pending_verification" && (
          <DialogFooter className="gap-2 sm:gap-0 font-medium">
            <Button variant="outline" className="flex-1 text-destructive hover:bg-destructive/10" onClick={onReject}>
              <XCircle className="size-4 mr-1" /> Reject
            </Button>
            <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={() => onApprove(log.id)}>
              <CheckCircle2 className="size-4 mr-1" /> Approve
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
