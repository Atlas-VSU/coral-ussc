"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { SelectTrigger, SelectValue, SelectContent, SelectItem, Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PenLine } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useProofOfPaymentForm } from "@/features/organization/fines/hooks/useProofOfPaymentForm";
import { PaymentFormData } from "@/lib/validators";
import type { Fee } from "@/features/organization/fees/types";
import type { StudentFeeRow } from "../../fees-roster/hooks/useFeesRoster";

interface ManualPaymentDialogProps {
  fee: Fee;
  student: StudentFeeRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (feeId: string, amount: string, method: "gcash" | "cash" | "bank_transfer" | "waiver", ref?: string, senderNumber?: string) => Promise<void>;
}

export function ManualPaymentDialog({
  fee,
  student,
  open,
  onOpenChange,
  onSuccess,
}: ManualPaymentDialogProps) {
  const [manualPayMethod, setManualPayMethod] = useState<string>("cash");
  const [manualPayNotes, setManualPayNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useProofOfPaymentForm({
    defaultValues: {
      userName: student?.student ? `${student.student.firstName} ${student.student.lastName}` : "",
      studentId: student?.student?.studentId || "",
      amount: fee?.amount || 0,
      paymentMethod: "cash",
      referenceNumber: "",
      senderNumber: "",
      imageUrl: "",
      rejectionReason: "",
      notes: "",
    },
  });

  if (!student) return null;

  const handleManualPayment = async (data: PaymentFormData) => {
    setIsSubmitting(true);
    try {
      await onSuccess(student.id, fee.amount.toString(), manualPayMethod as any, data.referenceNumber, data.senderNumber);
      // NOTE: We don't need a local receipt state/dialog here because `useFeesRosterUI` 
      // already handles showing the receipt globally after `onManualPaymentAdded` completes.
    } catch (error) {
       console.error(error);
    } finally {
      setIsSubmitting(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md ">
        <DialogHeader>
          <DialogTitle>Log Manual Payment</DialogTitle>
          <DialogDescription>
            Record a cash or direct payment for{" "}
            <span className="font-medium text-[#3b413a] font-semibold">
              {student.student?.firstName} {student.student?.lastName}
            </span>.
            This will immediately mark the fee as settled.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={async (e) => {
            e.preventDefault();
            await handleManualPayment(form.getValues());
          }}>
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border border-border px-4 py-3">
                <p className="text-xs text-[#3b413a]">Amount to settle</p>
                <p className="text-lg font-bold text-[#3b413a] mt-0.5">
                  ₱{(fee?.amount || 0).toLocaleString()}
                </p>
                <p className="text-xs text-[#3b413a] mt-0.5">
                  {fee?.title || "Fee"}
                </p>
              </div>

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1.5 text-[#3b413a] !bg-white">
                    <FormLabel>Payment Method<span className="text-destructive ">*</span></FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setManualPayMethod(value);
                        if (value === "cash") {
                          form.clearErrors("senderNumber");
                          form.clearErrors("referenceNumber");
                        }
                        if (value === "gcash") {
                          form.setValue("senderNumber", "");
                          form.setValue("referenceNumber", "");
                        }
                        if (value === "bank_transfer") {
                          form.setValue("senderNumber", "");
                        }
                      }}
                      defaultValue={manualPayMethod}
                    >
                      <FormControl>
                        <SelectTrigger className="!bg-white">
                          <SelectValue placeholder="Select a method"/>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="gcash">GCash</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {manualPayMethod !== "cash" && (
                <FormField
                  control={form.control}
                  name="referenceNumber"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-1.5 text-[#3b413a]">
                      <FormLabel>Reference Number <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={
                            manualPayMethod === "gcash" ? "GCash reference no." : "Bank transaction ref."
                          }
                          className="!bg-white"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              )}

              {manualPayMethod === "gcash" && (
                <FormField
                  control={form.control}
                  name="senderNumber"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-1.5 text-[#3b413a]">
                      <FormLabel>
                        Sender Number <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="09123456789" className="!bg-white" />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex flex-col gap-1.5 text-[#3b413a]">
                <Label htmlFor="manualPayNotes">
                  Notes <span className="text-xs text-[#3b413a]">(optional)</span>
                </Label>
                <Textarea
                  id="manualPayNotes"
                  rows={2}
                  placeholder="Any additional notes about this payment…"
                  value={manualPayNotes}
                  onChange={(e) => setManualPayNotes(e.target.value)}
                  className="resize-none text-xs !bg-white"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <LoadingButton 
                  type="submit" 
                  variant="success" 
                  className="gap-1.5" 
                  isLoading={isSubmitting}
                  loadingText="Processing..."
                >
                  <PenLine className="size-3.5" />
                  Mark as Paid
                </LoadingButton>
              </DialogFooter>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}