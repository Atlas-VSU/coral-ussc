"use client";
import { useMemo, useState } from "react";
import Image from "next/image";
import { AlertCircle, ArrowLeft, Building2, CreditCard, Loader2, Receipt, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { SuccessScreen } from "./components/SuccessScreen";
import { PaymentFormData } from "@/lib/validators";
import { usePaymentForm, ImageData } from "./hooks/usePaymentForm";
import { PaymentMethodSelector } from "./components/PaymentMethodSelector";
import { ImageUpload } from "./components/ImageUpload";
import { SelectedPaymentItems } from "@/app/(public)/payment/page";
import { PaymentBrandHeader } from "./components/PaymentBrandHeader";
import { PaymentProgressBar } from "./components/PaymentProgressBar";

interface StudentData {
  studentId: string;
  program: string;
  name: string;
}

interface OrganizationData {
  id: string;
  name: string;
  acronym: string;
}

interface FinesPaymentFormPageProps {
  studentData?: StudentData;
  organizationData?: OrganizationData;
  selectedPaymentItems?: SelectedPaymentItems;
  currentStep: 1 | 2 | 3 | 4;
  onBack?: () => void;
  onRestart?: () => void;
}

interface PublicSubmitResult {
  paymentHistoryId: string;
  submissionIds: string[];
}

export default function FinesPaymentFormPage({
  studentData,
  organizationData,
  selectedPaymentItems,
  currentStep,
  onBack,
  onRestart,
}: FinesPaymentFormPageProps) {
  const isContextualFlow = Boolean(studentData && organizationData && selectedPaymentItems);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<PublicSubmitResult | null>(null);

  const selectedTypes = useMemo(() => {
    if (!selectedPaymentItems) return [] as Array<"fees" | "fines">;
    return [
      ...(selectedPaymentItems.fees.length > 0 ? (["fees"] as const) : []),
      ...(selectedPaymentItems.fines.length > 0 ? (["fines"] as const) : []),
    ];
  }, [selectedPaymentItems]);

  const handleContextualSubmit = async (data: PaymentFormData, image: ImageData | null) => {
    setSubmitError(null);
    setSubmitResult(null);

    let imageUrl = "";
    if (image?.file) {
      const fd = new FormData();
      fd.append("file", image.file);
      fd.append("studentId", studentData!.studentId);
      const uploadRes = await fetch("/api/public/upload-receipt", { method: "POST", body: fd });
      const uploadResult = await uploadRes.json();
      if (!uploadRes.ok || !uploadResult.success) {
        const msg = uploadResult.error ?? "Failed to upload receipt image.";
        setSubmitError(msg);
        throw new Error(msg);
      }
      imageUrl = uploadResult.url as string;
    }

    const unpaidDues = [
      ...(selectedPaymentItems?.fees ?? []).map(fee => ({
        refId:        fee.id,
        title:        fee.description,
        amount:       fee.amount,
        paymentType:  "fees",
        parentFineId: "",
      })),
      ...(selectedPaymentItems?.fineItems ?? []).map(fine => ({
        refId:        fine.refId,
        title:        fine.title,
        amount:       fine.amount,
        paymentType:  "fines",
        parentFineId: fine.parentFineId,
      })),
    ];

    let referenceId = "bulk_transaction";
    if (selectedPaymentItems?.fees.length === 1 && selectedPaymentItems?.fineItems.length === 0) {
      referenceId = selectedPaymentItems.fees[0].id;
    } else if (selectedPaymentItems?.fineItems.length === 1 && selectedPaymentItems?.fees.length === 0) {
      referenceId = selectedPaymentItems.fines[0].id;
    }

    const res = await fetch("/api/public/submit-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userName:        data.userName,
        studentId:       data.studentId,
        orgId:           organizationData!.id,
        amount:          data.amount,
        paymentMethod:   data.paymentMethod,
        referenceNumber: data.referenceNumber,
        senderNumber:    data.senderNumber,
        imageUrl,
        notes:           data.notes,
        type:            selectedTypes.length === 1 ? selectedTypes[0] : "bulk",
        referenceId,
        dues:            unpaidDues,
      }),
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      const msg = result.error ?? "Payment submission failed. Please try again.";
      setSubmitError(msg);
      throw new Error(msg);
    }
  };

  const {
    form,
    image, setImage,
    status,
    needsRef, isGcash,
    handleMethodSelect,
    handleReset,
    onSubmit,
  } = usePaymentForm({
    initialValues: {
      userName:  studentData?.name ?? "",
      studentId: studentData?.studentId ?? "",
      amount:    selectedPaymentItems?.totalAmount ?? 0,
      type:      selectedTypes.length === 1 ? selectedTypes[0] : undefined,
    },
    onSubmitPayment: isContextualFlow ? handleContextualSubmit : undefined,
  });

  const { register, formState: { errors }, watch } = form;
  const watchedAmount = Number(watch("amount") ?? 0);
  const mobileTotal = isContextualFlow
    ? Number(selectedPaymentItems?.totalAmount ?? 0)
    : (Number.isFinite(watchedAmount) ? watchedAmount : 0);

  const handleSuccessReset = () => {
    setSubmitError(null);
    setSubmitResult(null);
    handleReset();
    onRestart?.();
  };

  if (status === "success") {
    return (
      <SuccessScreen
        form={form.getValues()}
        onReset={handleSuccessReset}
        currentStep={currentStep}
        paymentHistoryId={submitResult?.paymentHistoryId}
        submissionCount={submitResult?.submissionIds.length ?? 0}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#1B5E20]/5 dark:bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 pb-36 sm:pb-8 sm:px-6 lg:px-8">

        <PaymentBrandHeader />
        <PaymentProgressBar currentStep={currentStep} />

        {onBack && (
          <Button variant="ghost" onClick={onBack} className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Fees &amp; Fines
          </Button>
        )}

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Payment Submission</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Submit your payment details and receipt for verification.
          </p>
        </div>

        {isContextualFlow && studentData && organizationData && selectedPaymentItems && (
          <Card className="mb-5 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[#1B5E20] dark:text-[#8BC34A]" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Building2 className="h-4 w-4 text-[#1B5E20] dark:text-[#8BC34A]" />
                  <span>{organizationData.name}</span>
                  <span className="text-muted-foreground">({organizationData.acronym})</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {studentData.name} • {studentData.studentId} • {studentData.program}
                </div>
              </div>
              <div className="space-y-2 rounded-lg border bg-card p-4">
                {selectedPaymentItems.feeAmount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-blue-600" />
                      Fees ({selectedPaymentItems.fees.length} item{selectedPaymentItems.fees.length > 1 ? "s" : ""})
                    </span>
                    <span className="font-semibold">₱{selectedPaymentItems.feeAmount.toFixed(2)}</span>
                  </div>
                )}
                {selectedPaymentItems.fineAmount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-red-600" />
                      Fines ({selectedPaymentItems.fineItems.length} item{selectedPaymentItems.fineItems.length > 1 ? "s" : ""})
                    </span>
                    <span className="font-semibold">₱{selectedPaymentItems.fineAmount.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex items-center justify-between font-semibold">
                  <span>Total Due</span>
                  <span className="text-[#1B5E20] dark:text-[#8BC34A]">₱{selectedPaymentItems.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">

          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-foreground">Student Information</CardTitle>
              <CardDescription>Enter the details of the student making the payment.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="userName">Full Name <span className="text-[#1B5E20]">*</span></Label>
                  <Input id="userName" placeholder="e.g. Juan dela Cruz" {...register("userName")} readOnly={isContextualFlow}
                    className={errors.userName ? "border-destructive focus-visible:ring-destructive" : ""} />
                  {errors.userName && <FieldError message={errors.userName.message!} />}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="studentId">Student ID <span className="text-[#1B5E20]">*</span></Label>
                  <Input id="studentId" placeholder="21-1-12345" {...register("studentId")} readOnly={isContextualFlow}
                    className={errors.studentId ? "border-destructive focus-visible:ring-destructive" : ""} />
                  {errors.studentId ? <FieldError message={errors.studentId.message!} /> : <p className="text-xs text-muted-foreground">Format: XX-X-XXXXX</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-foreground">Payment Details</CardTitle>
              <CardDescription>Select your payment method and enter the amount.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="amount">Amount <span className="text-[#1B5E20]">*</span></Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold">₱</span>
                  <Input id="amount" type="number" step="0.01" min="0" placeholder="0.00"
                    {...register("amount", { valueAsNumber: true })} readOnly={isContextualFlow}
                    className={`pl-7 ${errors.amount ? "border-destructive focus-visible:ring-destructive" : ""}`} />
                </div>
                {errors.amount && <FieldError message={errors.amount.message!} />}
                {isContextualFlow && <p className="text-xs text-muted-foreground">Amount is fixed to match the selected dues.</p>}
              </div>
              <Separator />
              <div className="flex flex-col gap-1.5">
                <Label>Payment Method <span className="text-[#1B5E20]">*</span></Label>
                <PaymentMethodSelector value={watch("paymentMethod") ?? ""} error={errors.paymentMethod?.message} onSelect={handleMethodSelect} />
              </div>
              {needsRef && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="referenceNumber">Reference Number <span className="text-[#1B5E20]">*</span></Label>
                    <Input id="referenceNumber" placeholder="e.g. 1234567890" {...register("referenceNumber")}
                      className={errors.referenceNumber ? "border-destructive focus-visible:ring-destructive" : ""} />
                    {errors.referenceNumber && <FieldError message={errors.referenceNumber.message!} />}
                  </div>
                  {isGcash && (
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="senderNumber">Sender Number <span className="text-[#1B5E20]">*</span></Label>
                      <Input id="senderNumber" placeholder="09XXXXXXXXX" {...register("senderNumber")}
                        className={errors.senderNumber ? "border-destructive focus-visible:ring-destructive" : ""} />
                      {errors.senderNumber ? <FieldError message={errors.senderNumber.message!} /> : <p className="text-xs text-muted-foreground">Must be a valid PH number</p>}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {isGcash && (
            <Card className="border-border bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-950/30 dark:to-blue-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  GCash Payment Instructions
                </CardTitle>
                <CardDescription>Scan the QR code below using your GCash app to pay</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <div className="relative w-48 h-48 bg-white rounded-lg p-2 border-2 border-blue-200 dark:border-blue-800">
                  <Image
                    src="/images/public-student-payment/mock-qr-student-payment1.jpeg"
                    alt="GCash Payment QR Code"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="text-center text-sm text-muted-foreground space-y-1">
                  <p className="font-medium">1. Open GCash app</p>
                  <p>2. Tap "Scan QR" and scan the code above</p>
                  <p>3. Complete your payment</p>
                  <p className="font-medium text-[#1B5E20] dark:text-[#8BC34A] mt-2">Save your reference number for verification</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-foreground">Receipt / Proof of Payment</CardTitle>
              <CardDescription>Upload a screenshot or photo of your payment receipt.</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload value={image} onChange={setImage} />
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-foreground">Additional Information</CardTitle>
              <CardDescription>Optional notes or remarks about this payment.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" placeholder="Any additional notes or remarks..." {...register("notes")} rows={3} />
              </div>
            </CardContent>
          </Card>

          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <div className="fixed inset-x-0 bottom-16 sm:bottom-0 z-[60] border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] shadow-lg">
            <div className="mx-auto max-w-2xl flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Total Amount</p>
                <p className="text-lg font-bold text-[#1B5E20] dark:text-[#8BC34A]">₱{mobileTotal.toFixed(2)}</p>
              </div>
              <Button
                type="submit"
                disabled={status === "submitting"}
                className="bg-[#1B5E20] hover:bg-[#2E7D32] text-white dark:bg-[#1B5E20] dark:hover:bg-[#2E7D32] gap-2"
              >
                {status === "submitting" && <Loader2 className="size-4 animate-spin" />}
                {status === "submitting" ? "Submitting…" : "Submit Payment"}
              </Button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}

function FieldError({ message }: { message: string }) {
  return (
    <p className="text-xs text-destructive flex items-center gap-1.5">
      <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">!</span>
      {message}
    </p>
  );
}
