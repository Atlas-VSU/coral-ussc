import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PaymentFormData } from "@/lib/validators";

interface SuccessScreenProps {
  form: PaymentFormData;
  onReset: () => void;
  paymentHistoryId?: string;
  submissionCount?: number;
}

export function SuccessScreen({
  form,
  onReset,
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#1B5E20]/5 dark:bg-background px-3 py-6 sm:px-4 sm:py-8">
      <Card className="w-full max-w-md border-border">
        <CardContent className="flex flex-col items-center gap-4 p-5 text-center sm:gap-5 sm:p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1B5E20]/10 dark:bg-[#1B5E20]/20 text-[#1B5E20] dark:text-[#8BC34A] sm:h-16 sm:w-16">
            <CheckCircle2 className="size-7 sm:size-8" />
          </div>

          <div className="flex flex-col gap-1.5">
            <h2 className="text-lg font-bold text-foreground sm:text-xl">Payment Submitted</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Payment for{" "}
              <span className="font-semibold text-foreground">{form.userName}</span>{" "}
              has been submitted and is pending review.
            </p>
          </div>

          <Separator />

          <div className="w-full rounded-lg bg-muted/40 p-3 text-left sm:p-4">
            {summary.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 py-1 text-sm">
                <span className="text-muted-foreground leading-snug">{k}</span>
                <span className="max-w-[11rem] text-right font-semibold text-foreground capitalize break-words leading-snug">{v}</span>
              </div>
            ))}
          </div>

          <Button onClick={onReset} className="w-full bg-[#1B5E20] hover:bg-[#2E7D32] text-sm text-white dark:bg-[#1B5E20] dark:hover:bg-[#2E7D32] sm:text-base">
            Submit Another Payment
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
