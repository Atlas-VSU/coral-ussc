"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { PaymentLog } from "@/features/organization/fees/types";
import { AlertTriangle, Loader } from "lucide-react";

interface RejectDialogProps {
  log: PaymentLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rejectionReason: string;
  onReasonChange: (reason: string) => void;
  onConfirm: (id: string) => void;
  isSubmitting?: boolean;
}

export function RejectDialog({
  log,
  open,
  onOpenChange,
  rejectionReason,
  onReasonChange,
  onConfirm,
  isSubmitting = false,
}: RejectDialogProps) {
  if (!log) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm border-border bg-background">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="size-5" />
            </div>
            <DialogTitle>Reject Submission</DialogTitle>
          </div>
          <DialogDescription>
            Please provide a reason for rejecting the payment submission from 
            <span className="font-semibold text-foreground italic ml-1">{(log as any).studentName || "this student"}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Textarea
            placeholder="e.g., Reference number doesn't match, image is blurry..."
            value={rejectionReason}
            onChange={(e) => onReasonChange(e.target.value)}
            className="min-h-[100px] bg-muted/30 border-border focus:ring-1 focus:ring-primary"
            disabled={isSubmitting}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => onConfirm(log.id)}
            disabled={!rejectionReason.trim() || isSubmitting}
            className="gap-2"
          >
            {isSubmitting && <Loader className="size-4 animate-spin" />}
            {isSubmitting ? "Rejecting..." : "Confirm Rejection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
