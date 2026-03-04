"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Fee, PaymentLog, PaymentMethod } from "@/features/organization/fees/types";
import type { Member } from "@/features/organization/members/types";
import { Timestamp } from "firebase/firestore";
import { CreditCard, Landmark, Wallet } from "lucide-react";

interface ManualPaymentDialogProps {
  fee: Fee;
  student: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (log: PaymentLog) => void;
}

export function ManualPaymentDialog({
  fee,
  student,
  open,
  onOpenChange,
  onSuccess,
}: ManualPaymentDialogProps) {
  const [amount, setAmount] = useState(fee.amount.toString());
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [ref, setRef] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!student) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      const newLog: PaymentLog = {
        id: Math.random().toString(36).substr(2, 9),
        payment_number: Date.now(),
        amount: parseFloat(amount),
        payment_method: method,
        gcash_reference: method === "gcash" ? ref : null,
        status: "verified",
        paid_at: Timestamp.now(),
        verified_by: "Admin",
        verified_at: Timestamp.now(),
        created_at: Timestamp.now(),
      };
      
      // Inject UI props
      (newLog as any).studentId = student.studentId;
      (newLog as any).studentName = `${student.firstName} ${student.lastName}`;

      onSuccess(newLog);
      setIsSubmitting(false);
      onOpenChange(false);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border bg-background">
        <DialogHeader>
          <DialogTitle>Log Manual Payment</DialogTitle>
          <DialogDescription>
            Record a cash or Gcash payment for {student.firstName} {student.lastName}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount Provided</Label>
            <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground font-semibold italic text-sm">₱</span>
                <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 bg-muted/30 border-border focus:ring-1 focus:ring-primary"
                />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Payment Method</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
              <SelectTrigger className="bg-muted/30 border-border">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">
                    <div className="flex items-center gap-2">
                        <Wallet className="size-4" /> Cash
                    </div>
                </SelectItem>
                <SelectItem value="gcash">
                    <div className="flex items-center gap-2">
                        <Wallet className="size-4 text-blue-500" /> GCash
                    </div>
                </SelectItem>
                <SelectItem value="bank_transfer">
                    <div className="flex items-center gap-2">
                        <Landmark className="size-4" /> Bank Transfer
                    </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {method === "gcash" && (
            <div className="grid gap-2">
              <Label htmlFor="ref">Reference Number / Name</Label>
              <Input
                id="ref"
                placeholder="Enter GCash reference..."
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                className="bg-muted/30 border-border"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            className="bg-primary hover:bg-primary/90" 
            onClick={handleSubmit}
            disabled={isSubmitting || !amount}
          >
            {isSubmitting ? "Saving..." : "Record Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
