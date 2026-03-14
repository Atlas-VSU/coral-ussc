"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet } from "lucide-react";
import type { Fee } from "@/features/organization/fees/types";
import type { StudentFeeRow } from "../hooks/useFeesRoster";

interface ManualPaymentDialogProps {
  fee: Fee;
  student: StudentFeeRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (feeId: string, amount: string, method: "cash") => Promise<void>;
}

export function ManualPaymentDialog({
  fee,
  student,
  open,
  onOpenChange,
  onSuccess,
}: ManualPaymentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!student) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onSuccess(student.id, fee.amount.toString(), "cash");
    setIsSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm border-border bg-background">
        <DialogHeader>
          <DialogTitle>Cash Payment</DialogTitle>
          <DialogDescription>
            Record payment for {student.memberInfo.firstName} {student.memberInfo.lastName}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          {/* Fixed amount display */}
          <div className="grid gap-2">
            <Label htmlFor="amount" className="text-sm font-medium">
              Amount Due
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                ₱
              </span>
              <Input
                id="amount"
                type="text"
                value={fee.amount.toLocaleString()}
                disabled
                className="pl-7 bg-muted/20 border-border text-foreground font-medium"
              />
            </div>
          </div>

          {/* Static payment method indicator */}
          <div className="grid gap-2">
            <Label className="text-sm font-medium">Payment Method</Label>
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-sm text-foreground">
              <Wallet className="size-4 text-muted-foreground" />
              <span>Cash</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="min-w-[100px]"
          >
            {isSubmitting ? "Recording…" : "Record Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}