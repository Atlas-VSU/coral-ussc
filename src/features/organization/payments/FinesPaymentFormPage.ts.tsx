"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AlertCircle, ArrowLeft, BookOpen, Building2, CheckCircle, Copy, CreditCard, Info, Loader2, Phone, Receipt, ShieldAlert, User, UserCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { SuccessScreen } from "./components/SuccessScreen";
import { PaymentFormData } from "@/lib/validators";
import { usePaymentForm, ImageData } from "./hooks/usePaymentForm";
import { ImageUpload } from "./components/ImageUpload";
import { SelectedPaymentItems } from "@/app/(public)/payment/page";
import { PaymentBrandHeader } from "./components/PaymentBrandHeader";
import { PaymentProgressBar } from "./components/PaymentProgressBar";
import { PaymentStats } from "./components/PaymentStats";
import { PaymentStatus } from "@/constants/status";

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

interface PaymentDraft {
  form: Partial<PaymentFormData>;
  image?: {
    name: string;
    type: string;
    preview?: string;
  } | null;
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
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [showAuditorQr, setShowAuditorQr] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [restoredFromDraft, setRestoredFromDraft] = useState(false);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<number | null>(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  console.log(selectedPaymentItems)
  const selectedFineItems = selectedPaymentItems?.fineItems.filter(f => !f.isPending) ?? [];

  const selectedTypes = useMemo(() => {
    if (!selectedPaymentItems) return [] as Array<"fees" | "fines">;
    return [
      ...(selectedPaymentItems.fees.length > 0 ? (["fees"] as const) : []),
      ...(selectedFineItems.length > 0 ? (["fines"] as const) : []),
    ];
  }, [selectedPaymentItems]);

  const draftStorageKey = useMemo(() => {
    const studentKey = studentData?.studentId ?? "anonymous";
    const orgKey = organizationData?.id ?? "general";
    return `public-payment-draft:${studentKey}:${orgKey}`;
  }, [organizationData?.id, studentData?.studentId]);

  const clearDraft = () => {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(draftStorageKey);
  };

  const persistDraft = (draft: PaymentDraft) => {
    if (typeof window === "undefined") return;

    try {
      window.sessionStorage.setItem(draftStorageKey, JSON.stringify(draft));
      setLastDraftSavedAt(Date.now());
    } catch (error) {
      if (error instanceof DOMException && error.name === "QuotaExceededError") {
        try {
          const fallbackDraft: PaymentDraft = {
            ...draft,
            image: draft.image
              ? {
                  name: draft.image.name,
                  type: draft.image.type,
                }
              : null,
          };

          window.sessionStorage.setItem(draftStorageKey, JSON.stringify(fallbackDraft));
          setLastDraftSavedAt(Date.now());
          return;
        } catch {
          window.sessionStorage.removeItem(draftStorageKey);
        }
      }

      console.warn("Failed to persist payment draft:", error);
    }
  };

  const handleContextualSubmit = async (data: PaymentFormData, image: ImageData | null) => {
    setSubmitError(null);
    setSubmitResult(null);
    setReceiptError(null);

    if (!image?.file) {
      const msg = "Receipt image is required before submitting payment.";
      setReceiptError(msg);
      setSubmitError(msg);
      throw new Error(msg);
    }

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
        academicYear: fee.academicYear || "2025-2026",
        semester:     fee.semester || "2nd",
      })),
      ...(selectedFineItems.filter(f => !f.isPaid && !f.isPending) ?? []).map(fine => ({
        refId:        fine.refId,
        title:        fine.title,
        amount:       fine.amount,
        paymentType:  "fines",
        parentFineId: fine.parentFineId,
        academicYear: "2025-2026",
        semester:     "2nd",
      })),
    ];

    let referenceId = "bulk_transaction";
    if (selectedPaymentItems?.fees.length === 1 && selectedFineItems.length === 0) {
      referenceId = selectedPaymentItems.fees[0].id;
    } else if (selectedFineItems.length === 1 && selectedPaymentItems?.fees.length === 0) {
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

    clearDraft();
  };

  const {
    form,
    image, setImage,
    status,
    needsRef, isGcash,
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
  const feeCount = selectedPaymentItems?.fees.length ?? 0;
  const fineCount = selectedFineItems.length ?? 0;
  const treasurerName = "Kleenie Elumene B. Yuzon";
  const treasurerNumber = "09631000393";
  const auditorName = "Reniel Emberso";
  const auditorNumber = "09123127184";

  useEffect(() => {
    let cancelled = false;

    const restoreDraft = async () => {
      if (typeof window === "undefined") return;

      try {
        const rawDraft = window.sessionStorage.getItem(draftStorageKey);
        if (!rawDraft) {
          setDraftRestored(true);
          return;
        }

        setRestoredFromDraft(true);

        const draft = JSON.parse(rawDraft) as PaymentDraft;

        if (draft.form) {
          form.reset({
            ...form.getValues(),
            ...draft.form,
            userName: studentData?.name ?? draft.form.userName ?? form.getValues("userName"),
            studentId: studentData?.studentId ?? draft.form.studentId ?? form.getValues("studentId"),
            amount: selectedPaymentItems?.totalAmount ?? draft.form.amount ?? form.getValues("amount"),
            type: selectedTypes.length === 1 ? selectedTypes[0] : draft.form.type,
          });
        }

      } catch (error) {
        console.error("Failed to restore payment draft:", error);
      } finally {
        if (!cancelled) {
          setDraftRestored(true);
        }
      }
    };

    void restoreDraft();

    return () => {
      cancelled = true;
    };
  }, [draftStorageKey, form, selectedPaymentItems?.totalAmount, selectedTypes, setImage, studentData?.name, studentData?.studentId]);

  useEffect(() => {
    if (!draftRestored || typeof window === "undefined") return;

    const subscription = form.watch((value) => {
      const draft: PaymentDraft = {
        form: {
          ...value,
          userName: value.userName ?? "",
          studentId: value.studentId ?? "",
          amount: value.amount ?? 0,
          paymentMethod: value.paymentMethod,
          referenceNumber: value.referenceNumber ?? "",
          senderNumber: value.senderNumber ?? "",
          notes: value.notes ?? "",
          type: value.type,
          paymentHistoryId: value.paymentHistoryId,
          referenceId: value.referenceId,
        },
        image: image
          ? {
              name: image.file.name,
              type: image.file.type,
            }
          : null,
      };

      persistDraft(draft);
    });

    return () => subscription.unsubscribe();
  }, [draftRestored, draftStorageKey, form, image]);

  useEffect(() => {
    if (!draftRestored || typeof window === "undefined") return;

    const currentDraft = window.sessionStorage.getItem(draftStorageKey);
    const parsedDraft = currentDraft ? (JSON.parse(currentDraft) as PaymentDraft) : { form: {} };

    persistDraft({
      ...parsedDraft,
      image: image
        ? {
            name: image.file.name,
            type: image.file.type,
          }
        : null,
    });
  }, [draftRestored, draftStorageKey, image]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.visualViewport) return;

    const updateKeyboardOffset = () => {
      const viewport = window.visualViewport;
      if (!viewport) return;

      const offset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setKeyboardOffset(offset > 120 ? offset : 0);
    };

    updateKeyboardOffset();
    window.visualViewport.addEventListener("resize", updateKeyboardOffset);
    window.visualViewport.addEventListener("scroll", updateKeyboardOffset);

    return () => {
      window.visualViewport?.removeEventListener("resize", updateKeyboardOffset);
      window.visualViewport?.removeEventListener("scroll", updateKeyboardOffset);
    };
  }, []);

  const handleSuccessReset = () => {
    setSubmitError(null);
    setSubmitResult(null);
    clearDraft();
    handleReset();
    onRestart?.();
  };

  if (status === "success") {
    return (
      <SuccessScreen
        form={form.getValues()}
        onReset={handleSuccessReset}
        paymentHistoryId={submitResult?.paymentHistoryId}
        submissionCount={submitResult?.submissionIds.length ?? 0}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#1B5E20]/5 dark:bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 pb-36 sm:px-6 lg:px-8">
        <PaymentBrandHeader />
        <div className="mb-6">
          <PaymentProgressBar
            currentStep={currentStep}
            subtitle="Review payment details and submit proof of payment"
          />
        </div>

        {onBack && (
          <Button variant="ghost" onClick={onBack} className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Fees &amp; Fines
          </Button>
        )}

        <div className="mb-6">
          {restoredFromDraft && (
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-2">
              Draft restored from your previous session.
            </p>
          )}
          {lastDraftSavedAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Draft saved at {new Date(lastDraftSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
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
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1B5E20]/15 dark:bg-[#1B5E20]/25">
                    <Building2 className="h-5 w-5 text-[#1B5E20] dark:text-[#8BC34A]" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-sm font-semibold text-foreground leading-tight">{organizationData.acronym}</p>
                    <p className="text-xs text-muted-foreground truncate">{organizationData.name}</p>
                  </div>
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
                      Fines ({selectedFineItems.length} item{selectedFineItems.length > 1 ? "s" : ""})
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

        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">

          {/* Section 1 — Student Info */}
          <div>
            <SectionHeading number={1} title="Student Info" />
            <Card className="border-border">
              <CardContent className="pt-4 flex flex-col gap-4">
                <input type="hidden" {...register("userName")} />
                <input type="hidden" {...register("studentId")} />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-md border bg-muted/30 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Full Name</p>
                    <p className="text-sm font-medium text-foreground break-words">{watch("userName") || "—"}</p>
                  </div>
                  <div className="rounded-md border bg-muted/30 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Student ID</p>
                    <p className="text-sm font-medium text-foreground">{watch("studentId") || "—"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section 2 — Payment Details */}
          <div className="flex flex-col">
            <SectionHeading number={2} title="Payment Details" />
            {isGcash && (
              <Card className="mt-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-950/30 dark:to-blue-950/20">
                <CardContent className="pt-4 flex flex-col items-center gap-4">
                  <p className="text-xs text-muted-foreground self-start flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-blue-600" />
                    Pay via GCash using either QR code or manual send money
                  </p>
                  
                  {/* QR Code Section */}
                  <div className="relative w-48 h-48 bg-white rounded-lg p-2 border-2 border-blue-200 dark:border-blue-800">
                    <Image
                      src="/images/public-student-payment/USSC-Treasurer.png"
                      alt="Treasurer GCash Payment QR Code"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>

                  {/* GCash Account Details */}
                  <div className="w-full bg-white/80 dark:bg-gray-900/80 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-blue-600 hidden md:block" />
                      Treasurer GCash Details
                    </h4>
                    <div className="space-y-3">
                      <div className="flex flex-col gap-1 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg min-[430px]:flex-row min-[430px]:items-center min-[430px]:justify-between">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-600 hidden md:block " />
                          <span className="text-xs md:text-sm text-muted-foreground">Treasurer Name:</span>
                        </div>
                        <span className="font-medium text-sm md:text-base break-words text-left min-[430px]:text-right">{treasurerName}</span>
                      </div>
                      <div className="flex flex-col gap-1 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg min-[430px]:flex-row min-[430px]:items-center min-[430px]:justify-between">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-blue-600 hidden md:block" />
                          <span className="text-xs md:text-sm text-muted-foreground">GCash Number:</span>
                        </div>
                        <div className="flex w-full items-center justify-between gap-2 min-[430px]:w-auto min-[430px]:justify-end">
                          <span className="font-medium text-sm md:text-base">{treasurerNumber}</span>
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(treasurerNumber)}
                            className="p-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors"
                          >
                            <Copy className="h-3.5 w-3.5 text-blue-600" />
                          </button>
                        </div>
                      </div>
                      <Dialog open={showAuditorQr} onOpenChange={setShowAuditorQr}>
                        <DialogTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-auto w-full whitespace-normal py-2 text-xs leading-snug border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/30 sm:text-sm"
                          >
                            Use alternative payment account (Auditor)
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[calc(100%-1.5rem)] max-w-md rounded-lg sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Alternative GCash Account</DialogTitle>
                            <DialogDescription>
                              Use the auditor account only if the treasurer account is unavailable.
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4">
                            <div className="relative mx-auto h-48 w-48 rounded-lg border-2 border-blue-200 bg-white p-2 dark:border-blue-800">
                              <Image
                                src="/images/public-student-payment/USSC-Auditor.png"
                                alt="Auditor GCash Payment QR Code"
                                fill
                                className="object-contain"
                              />
                            </div>

                            <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3 dark:border-blue-800 dark:bg-blue-950/20">
                              <div className="mb-2 flex flex-col gap-1 min-[430px]:flex-row min-[430px]:items-center min-[430px]:justify-between min-[430px]:gap-2">
                                <span className="text-sm text-muted-foreground">Auditor Name:</span>
                                <span className="text-sm font-medium break-words text-left min-[430px]:text-right">{auditorName}</span>
                              </div>
                              <div className="flex flex-col gap-1 min-[430px]:flex-row min-[430px]:items-center min-[430px]:justify-between min-[430px]:gap-2">
                                <span className="text-sm text-muted-foreground">GCash Number:</span>
                                <div className="flex w-full items-center justify-between gap-2 min-[430px]:w-auto min-[430px]:justify-end">
                                  <span className="text-sm font-medium">{auditorNumber}</span>
                                  <button
                                    type="button"
                                    onClick={() => navigator.clipboard.writeText(auditorNumber)}
                                    className="rounded p-1 transition-colors hover:bg-blue-200 dark:hover:bg-blue-800"
                                  >
                                    <Copy className="h-3.5 w-3.5 text-blue-600" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  {/* Payment Steps */}
                  <div className="w-full space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-600" />
                      How to pay via GCash:
                    </h4>
                    
                    {/* Option 1: QR Code */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-blue-600">Option 1: Scan QR Code</p>
                      <ol className="space-y-1.5 pl-5 list-decimal text-xs text-muted-foreground">
                        <li>Open GCash app and tap "Scan QR"</li>
                        <li>Scan the QR code above</li>
                        <li>Verify the account name: <span className="font-medium text-foreground">{treasurerName}</span></li>
                        <li>Enter the amount: <span className="font-medium text-foreground">₱{mobileTotal}</span></li>
                        <li>Add your Student ID as a note (Optional)</li>
                        <li>Complete payment and save reference number</li>
                      </ol>
                    </div>

                    {/* Option 2: Send Money */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-blue-600">Option 2: Send Money</p>
                      <ol className="space-y-1.5 pl-5 list-decimal text-xs text-muted-foreground">
                        <li>Open GCash app and tap "Send Money"</li>
                        <li>Enter GCash number: <span className="font-medium text-foreground">{treasurerNumber}</span></li>
                        <li>Verify account name: <span className="font-medium text-foreground">{treasurerName}</span></li>
                        <li>Enter amount: <span className="font-medium text-foreground">₱{mobileTotal}</span></li>
                        <li>Add your Student ID in the message/notes (Optional)</li>
                        <li>Review and confirm payment</li>
                        <li>Save the reference number shown after payment</li>
                      </ol>
                    </div>
                  </div>

                  {/* Important Reminder */}
                  <div className="w-full bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <p className="text-xs flex items-start gap-2">
                      <span className="text-yellow-600 dark:text-yellow-500">📱</span>
                      <span className="text-muted-foreground">
                        <span className="font-medium text-yellow-700 dark:text-yellow-400">Important:</span>{' '}
                        Save your GCash reference number. Take a screenshot of the confirmation page and send it to our support for faster verification.
                      </span>
                    </p>
                  </div>

                  {/* Reference Number Reminder */}
                  <p className="font-medium text-[#1B5E20] dark:text-[#8BC34A] mt-2 flex items-center justify-center gap-1.5 text-sm md:text-base text-center">
                    <CheckCircle className="h-4 w-4 hidden md:block" />
                    Save your reference number for verification
                  </p>
                </CardContent>
              </Card>
            )}
            <Card className="border-border mt-2">
              <CardContent className="pt-4 flex flex-col gap-4">
                <input type="hidden" {...register("amount", { valueAsNumber: true })} />
                <div className="rounded-md border bg-muted/30 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="text-sm font-semibold text-foreground">₱{(Number(watch("amount") ?? 0)).toFixed(2)}</p>
                </div>
                {errors.amount && <FieldError message={errors.amount.message!} />}
                <Separator />
                <input type="hidden" {...register("paymentMethod")} />
                <div className="rounded-md border bg-muted/30 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Payment Method</p>
                  <p className="text-sm font-medium text-foreground">GCash</p>
                </div>
                {errors.paymentMethod && <FieldError message={errors.paymentMethod.message!} />}
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
            
          </div>

          {/* Section 3 — Upload Receipt */}
          <div>
            <SectionHeading number={3} title="Upload Receipt" />
            <Card className="border-border">
              <CardContent className="pt-4">
                <ImageUpload
                  value={image}
                  onChange={(nextImage) => {
                    setImage(nextImage);
                    if (nextImage?.file) {
                      setReceiptError(null);
                    }
                  }}
                />
                <p className="mt-2 text-xs text-muted-foreground">Receipt image is required.</p>
                {receiptError && <FieldError message={receiptError} />}
              </CardContent>
            </Card>
          </div>

          {/* Section 4 — Notes */}
          <div>
            <SectionHeading number={4} title="Notes" optional />
            <Card className="border-border">
              <CardContent className="pt-4">
                <Textarea id="notes" placeholder="Any additional notes or remarks..." {...register("notes")} rows={3} />
              </CardContent>
            </Card>
          </div>

          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <div
            className="fixed inset-x-0 bottom-0 z-[60] border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] shadow-lg"
            style={{ bottom: keyboardOffset > 0 ? `${keyboardOffset}px` : 0 }}
          >
            <div className="mx-auto max-w-2xl">
              {status === "submitting" ? (
                <div className="w-full rounded-md bg-[#1B5E20] text-white dark:bg-[#1B5E20] px-4 py-2.5 flex items-center justify-center gap-2 font-medium">
                  <Loader2 className="size-4 animate-spin" />
                  Submitting payment…
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Total Amount</p>
                    {isContextualFlow && (
                      <p className="text-[11px] text-muted-foreground">Includes {feeCount} fees + {fineCount} fines</p>
                    )}
                    <p className="text-lg font-bold text-[#1B5E20] dark:text-[#8BC34A]">₱{mobileTotal.toFixed(2)}</p>
                  </div>
                  <Button
                    type="submit"
                    disabled={!image?.file}
                    className="bg-[#1B5E20] hover:bg-[#2E7D32] text-white dark:bg-[#1B5E20] dark:hover:bg-[#2E7D32] gap-2"
                  >
                    Submit Payment
                  </Button>
                </div>
              )}
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

function SectionHeading({
  number,
  title,
  optional = false,
}: {
  number: number;
  title: string;
  optional?: boolean;
}) {
  return (
    <div className="mb-2 flex items-center gap-2.5">
      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1B5E20] text-[11px] font-semibold text-white dark:bg-[#2E7D32]">
        {number}
      </span>
      <p className="text-sm font-semibold text-foreground">
        {title}
        {optional && <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>}
      </p>
    </div>
  );
}
