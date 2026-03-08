"use client";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { SuccessScreen } from "./components/SuccessScreen";
import { usePaymentForm } from "./hooks/usePaymentForm";
import { PaymentMethodSelector } from "./components/PaymentMethodSelector";
import { ImageUpload } from "./components/ImageUpload";

export default function PaymentFormPage() {
  const {
    form,
    image, setImage,
    status,
    needsRef, isGcash,
    handleMethodSelect,
    handleReset,
    onSubmit,
  } = usePaymentForm();

  const { register, formState: { errors }, watch } = form;

  if (status === "success") {
    return <SuccessScreen form={form.getValues()} onReset={handleReset} />;
  }

  return (
    <div className="min-h-screen bg-green-50/50 dark:bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Page Header ── */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Payment Submission</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Submit your payment details and receipt for verification.
          </p>
        </div>

        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">

          {/* ── Student Information ── */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-foreground">Student Information</CardTitle>
              <CardDescription>Enter the details of the student making the payment.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="userName">
                    Full Name <span className="text-green-600">*</span>
                  </Label>
                  <Input
                    id="userName"
                    placeholder="e.g. Juan dela Cruz"
                    {...register("userName")}
                    className={errors.userName ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {errors.userName && <FieldError message={errors.userName.message!} />}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="studentId">
                    Student ID <span className="text-green-600">*</span>
                  </Label>
                  <Input
                    id="studentId"
                    placeholder="21-1-12345"
                    {...register("studentId")}
                    className={errors.studentId ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {errors.studentId
                    ? <FieldError message={errors.studentId.message!} />
                    : <p className="text-xs text-muted-foreground">Format: XX-X-XXXXX</p>}
                </div>

              </div>
            </CardContent>
          </Card>

          {/* ── Payment Details ── */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-foreground">Payment Details</CardTitle>
              <CardDescription>Select your payment method and enter the amount.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="amount">
                  Amount <span className="text-green-600">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold">₱</span>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register("amount", { valueAsNumber: true })}
                    className={`pl-7 ${errors.amount ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                </div>
                {errors.amount && <FieldError message={errors.amount.message!} />}
              </div>

              <Separator />

              <div className="flex flex-col gap-1.5">
                <Label>Payment Method <span className="text-green-600">*</span></Label>
                <PaymentMethodSelector
                  value={watch("paymentMethod") ?? ""}
                  error={errors.paymentMethod?.message}
                  onSelect={handleMethodSelect}
                />
              </div>

              {needsRef && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="referenceNumber">
                      Reference Number <span className="text-green-600">*</span>
                    </Label>
                    <Input
                      id="referenceNumber"
                      placeholder="e.g. 1234567890"
                      {...register("referenceNumber")}
                      className={errors.referenceNumber ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                    {errors.referenceNumber && <FieldError message={errors.referenceNumber.message!} />}
                  </div>

                  {isGcash && (
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="senderNumber">
                        Sender Number <span className="text-green-600">*</span>
                      </Label>
                      <Input
                        id="senderNumber"
                        placeholder="09XXXXXXXXX"
                        {...register("senderNumber")}
                        className={errors.senderNumber ? "border-destructive focus-visible:ring-destructive" : ""}
                      />
                      {errors.senderNumber
                        ? <FieldError message={errors.senderNumber.message!} />
                        : <p className="text-xs text-muted-foreground">Must be a valid PH number</p>}
                    </div>
                  )}
                </div>
              )}

            </CardContent>
          </Card>

          {/* ── Receipt Image ── */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-foreground">Receipt / Proof of Payment</CardTitle>
              <CardDescription>Upload a screenshot or photo of your payment receipt.</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload value={image} onChange={setImage} />
            </CardContent>
          </Card>

          {/* ── Notes ── */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-foreground">Additional Information</CardTitle>
              <CardDescription>Optional notes or remarks about this payment.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes or remarks..."
                  {...register("notes")}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* ── Submit ── */}
          <Button
            type="submit"
            disabled={status === "submitting"}
            className="w-full bg-green-600 hover:bg-green-700 text-white dark:bg-green-600 dark:hover:bg-green-700 gap-2"
          >
            {status === "submitting" && <Loader2 className="size-4 animate-spin" />}
            {status === "submitting" ? "Submitting…" : "Submit Payment"}
          </Button>

        </form>
      </div>
    </div>
  );
}

// ─── Small helper ─────────────────────────────────────────────────────────────
function FieldError({ message }: { message: string }) {
  return (
    <p className="text-xs text-destructive flex items-center gap-1.5">
      <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">!</span>
      {message}
    </p>
  );
}
