import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PaymentFormData } from "@/lib/validators";
import { PaymentBrandHeader } from "./PaymentBrandHeader";
import { PaymentProgressBar } from "./PaymentProgressBar";

interface SuccessScreenProps {
  form: PaymentFormData;
  onReset: () => void;
  currentStep: 1 | 2 | 3 | 4;
  paymentHistoryId?: string;
  submissionCount?: number;
}

export function SuccessScreen({
  form,
  onReset,
  currentStep,
  paymentHistoryId,
  submissionCount = 0,
}: SuccessScreenProps) {
  const summary = [
    ["Student",        form.userName],
    ["Student ID",     form.studentId],
    ["Amount",         `₱${parseFloat(String(form.amount)).toLocaleString()}`],
    ["Payment Method", form.paymentMethod.replace("_", " ")],
    ...(form.referenceNumber ? [["Reference No.", form.referenceNumber]] : []),
    ...(submissionCount > 0 ? [["Items Submitted", String(submissionCount)]] : []),
    ...(paymentHistoryId ? [["Request ID", paymentHistoryId]] : []),
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#1B5E20]/5 dark:bg-background px-4 py-8">
      <PaymentBrandHeader />
      <PaymentProgressBar currentStep={currentStep} />
      <Card className="w-full max-w-md border-border">
        <CardContent className="flex flex-col items-center gap-5 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1B5E20]/10 dark:bg-[#1B5E20]/20 text-[#1B5E20] dark:text-[#8BC34A]">
            <CheckCircle2 className="size-8" />
          </div>

          <div className="flex flex-col gap-1.5">
            <h2 className="text-xl font-bold text-foreground">Payment Submitted</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Payment for{" "}
              <span className="font-semibold text-foreground">{form.userName}</span>{" "}
              has been submitted and is pending review.
            </p>
          </div>

          <Separator />

          <div className="w-full rounded-lg bg-muted/40 p-4 text-left">
            {summary.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-1 text-sm">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-semibold text-foreground capitalize">{v}</span>
              </div>
            ))}
          </div>

          <Button onClick={onReset} className="w-full bg-[#1B5E20] hover:bg-[#2E7D32] text-white dark:bg-[#1B5E20] dark:hover:bg-[#2E7D32]">
            Submit Another Payment
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
