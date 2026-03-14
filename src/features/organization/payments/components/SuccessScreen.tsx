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
    <div className="flex min-h-screen items-center justify-center bg-green-50 dark:bg-background px-4 py-8">
      <Card className="w-full max-w-md border-border">
        <CardContent className="flex flex-col items-center gap-5 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400">
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

          <Button onClick={onReset} className="w-full bg-green-600 hover:bg-green-700 text-white dark:bg-green-600 dark:hover:bg-green-700">
            Submit Another Payment
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
