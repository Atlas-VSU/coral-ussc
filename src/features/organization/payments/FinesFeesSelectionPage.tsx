"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Receipt, AlertCircle, CheckCircle2, Building2 } from "lucide-react";
import { FeeItem, Fine, FineItem, OrganizationData, StudentData } from "@/app/(public)/payment/page";
import { PaymentBrandHeader } from "./components/PaymentBrandHeader";
import { PaymentProgressBar } from "./components/PaymentProgressBar";


interface FinesFeesSelectionPageProps {
  studentData: StudentData;
  organizationData: OrganizationData;
  currentStep: 1 | 2 | 3 | 4;
  fees: FeeItem[];
  fines: Fine[];
  fineItems: FineItem[];
  onBack: () => void;
  onNext: (selectedItems: {
    fees: FeeItem[];
    fines: Fine[];
    fineItems: FineItem[];
    feeAmount: number;
    fineAmount: number;
    totalAmount: number;
  }) => void;
}

export default function FinesFeesSelectionPage({
  studentData,
  organizationData,
  currentStep,
  fees,
  fines,
  fineItems,
  onBack,
  onNext,
}: FinesFeesSelectionPageProps) {
  const [payFees, setPayFees] = useState(false);
  const [payFines, setPayFines] = useState(false);

  const getPaymentStatus = (item: {
    isPayable?: boolean;
    paymentState?: "unpaid" | "pending" | "rejected";
    latestRejectionReason?: string;
  }) => {
    if (item.paymentState === "pending" || item.isPayable === false) {
      return {
        label: "Pending",
        className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300",
      };
    }

    if (item.paymentState === "rejected" || item.latestRejectionReason) {
      return {
        label: "Rejected",
        className: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300",
      };
    }

    return {
      label: "Payable",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300",
    };
  };

  const formatDisplayDate = (value?: unknown) => {
    if (!value) return null;

    if (
      typeof value === "object" &&
      value !== null &&
      "_seconds" in value &&
      typeof (value as { _seconds?: unknown })._seconds === "number"
    ) {
      const seconds = (value as { _seconds: number })._seconds;
      return new Date(seconds * 1000).toLocaleDateString();
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value.toLocaleDateString();
    }

    if (typeof value !== "string") return null;

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString();
  };

  // Calculate totals
  const feesTotal = useMemo(() => {
    return fees.reduce((sum, fee) => sum + fee.amount, 0);
  }, [fees]);

  const finesTotal = useMemo(() => {
    return fines.reduce((sum, fine) => sum + fine.amount, 0);
  }, [fines]);

  const payableFees = useMemo(() => fees.filter((fee) => fee.isPayable !== false), [fees]);
  const payableFines = useMemo(() => fines.filter((fine) => fine.isPayable !== false), [fines]);

  const feesPayableTotal = useMemo(() => {
    return payableFees.reduce((sum, fee) => sum + fee.amount, 0);
  }, [payableFees]);

  const finesPayableTotal = useMemo(() => {
    return payableFines.reduce((sum, fine) => sum + fine.amount, 0);
  }, [payableFines]);

  const fineById = useMemo(() => {
    return new Map(fines.map((fine) => [fine.id, fine]));
  }, [fines]);

  const grandTotal = (payFees ? feesPayableTotal : 0) + (payFines ? finesPayableTotal : 0);

  const handleContinue = () => {
    if (payFees || payFines) {
      onNext({
        fees: payFees ? payableFees : [],
        fines: payFines ? payableFines : [],
        fineItems: payFines ? fineItems : [],
        feeAmount: payFees ? feesPayableTotal : 0,
        fineAmount: payFines ? finesPayableTotal : 0,
        totalAmount: grandTotal,
      });
    }
  };

  const hasSelection = payFees || payFines;
  const hasPayableFees = payableFees.length > 0;
  const hasPayableFines = payableFines.length > 0;

  return (
    <div className="min-h-screen bg-[#1B5E20]/5 dark:bg-background py-8 pb-36 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <PaymentBrandHeader />
        <PaymentProgressBar currentStep={currentStep} />
        {/* Back Button */}
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Organization Selection
        </Button>

        {/* Student & Organization Info Banner */}
        <Card className="border-[#1B5E20]/20 dark:border-[#1B5E20]/30 bg-[#1B5E20]/5 dark:bg-[#1B5E20]/10">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#1B5E20] dark:text-[#8BC34A]" />
                  <span className="font-semibold text-lg">{organizationData.acronym}</span>
                  <Badge variant="secondary">{organizationData.name}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">{studentData.name}</span>
                  <span className="mx-2">•</span>
                  <span>{studentData.studentId}</span>
                  <span className="mx-2">•</span>
                  <span>{studentData.program}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold">Select Fees & Fines to Pay</h1>
          <p className="text-muted-foreground mt-2">
            Choose the items you want to pay. You can select fees, fines, or both.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Fees Section */}
          <Card className="h-fit">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <CardTitle>Membership Fees</CardTitle>
                </div>
                <Badge variant="outline" className="text-blue-600 dark:text-blue-400">
                  ₱{feesTotal.toFixed(2)}
                </Badge>
              </div>
              <CardDescription>Required membership and registration fees</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pay All Fees Toggle */}
              {fees.length > 0 && (
                <>
                  <div
                    className={`flex items-center space-x-2 p-4 rounded-lg border-2 transition-colors ${
                      payFees
                        ? "bg-blue-50 dark:bg-blue-950/20 border-blue-500 dark:border-blue-600"
                        : hasPayableFees
                          ? "bg-muted/50 border-border hover:bg-muted cursor-pointer"
                          : "bg-muted/30 border-border opacity-70 cursor-not-allowed"
                    }`}
                    onClick={() => {
                      if (!hasPayableFees) return;
                      setPayFees(!payFees);
                    }}
                  >
                    <Checkbox
                      id="pay-all-fees"
                      checked={payFees}
                      disabled={!hasPayableFees}
                      onCheckedChange={(checked) => {
                        if (!hasPayableFees) return;
                        setPayFees(checked === true);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-sm font-semibold leading-none flex-1">
                      Pay All Fees
                    </span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      ₱{feesPayableTotal.toFixed(2)}
                    </span>
                  </div>
                  {!hasPayableFees && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 px-1">
                      All fee items are currently pending verification and cannot be selected.
                    </p>
                  )}
                  <Separator />
                  <p className="text-xs text-muted-foreground px-1">Fee Breakdown:</p>
                </>
              )}

              {/* Fee Items Breakdown (Read-only) */}
              <div className="space-y-2">
                {fees.map((fee) => (
                  <div
                    key={fee.id}
                    className={`flex items-start justify-between gap-4 p-3 rounded-lg border ${
                      fee.isPayable === false ? "bg-amber-50/60 dark:bg-amber-950/20" : "bg-card"
                    }`}
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{fee.description}</p>
                        {(() => {
                          const status = getPaymentStatus(fee);
                          return (
                            <Badge variant="outline" className={status.className}>
                              {status.label}
                            </Badge>
                          );
                        })()}
                      </div>
                      {formatDisplayDate(fee.dueDate) && (
                        <p className="text-xs text-muted-foreground">Due: {formatDisplayDate(fee.dueDate)}</p>
                      )}
                      {fee.paymentState === "pending" && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          Status: Pending verification (not selectable)
                        </p>
                      )}
                      {fee.latestRejectionReason && (
                        <p className="text-xs text-red-600 dark:text-red-400">
                          Last rejected reason: {fee.latestRejectionReason}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 ml-4">
                      ₱{fee.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {fees.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No outstanding fees</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fines Section */}
          <Card className="h-fit">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <CardTitle>Fines & Penalties</CardTitle>
                </div>
                <Badge variant="outline" className="text-red-600 dark:text-red-400">
                  ₱{finesTotal.toFixed(2)}
                </Badge>
              </div>
              <CardDescription>Outstanding fines and penalty charges</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pay All Fines Toggle */}
              {fines.length > 0 && (
                <>
                  <div
                    className={`flex items-center space-x-2 p-4 rounded-lg border-2 transition-colors ${
                      payFines
                        ? "bg-red-50 dark:bg-red-950/20 border-red-500 dark:border-red-600"
                        : hasPayableFines
                          ? "bg-muted/50 border-border hover:bg-muted cursor-pointer"
                          : "bg-muted/30 border-border opacity-70 cursor-not-allowed"
                    }`}
                    onClick={() => {
                      if (!hasPayableFines) return;
                      setPayFines(!payFines);
                    }}
                  >
                    <Checkbox
                      id="pay-all-fines"
                      checked={payFines}
                      disabled={!hasPayableFines}
                      onCheckedChange={(checked) => {
                        if (!hasPayableFines) return;
                        setPayFines(checked === true);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-sm font-semibold leading-none flex-1">
                      Pay All Fines
                    </span>
                    <span className="text-lg font-bold text-red-600 dark:text-red-400">
                      ₱{finesPayableTotal.toFixed(2)}
                    </span>
                  </div>
                  {!hasPayableFines && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 px-1">
                      All fine items are currently pending verification and cannot be selected.
                    </p>
                  )}
                  <Separator />
                  <p className="text-xs text-muted-foreground px-1">Fines Breakdown:</p>
                </>
              )}

              {/* Fine Items Breakdown (Read-only) */}
              <div className="space-y-2">
                {fineItems.map((fine) => {
                  const parentFine = fineById.get(fine.parentFineId);
                  const status = getPaymentStatus({
                    isPayable: parentFine?.isPayable,
                    paymentState: parentFine?.paymentState,
                    latestRejectionReason: parentFine?.latestRejectionReason,
                  });

                  return (
                    <div
                      key={fine.refId}
                      className={`flex items-start justify-between gap-4 p-3 rounded-lg border ${
                        parentFine?.isPayable === false ? "bg-amber-50/60 dark:bg-amber-950/20" : "bg-card"
                      }`}
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">{fine.title}</p>
                          <Badge variant="outline" className={status.className}>
                            {status.label}
                          </Badge>
                        </div>
                        {formatDisplayDate(fine.date) && (
                          <p className="text-xs text-muted-foreground">Date: {formatDisplayDate(fine.date)}</p>
                        )}
                        {parentFine?.reason && (
                          <p className="text-xs text-muted-foreground italic">{parentFine.reason}</p>
                        )}
                        {parentFine?.paymentState === "pending" && (
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            Status: Pending verification (not selectable)
                          </p>
                        )}
                        {parentFine?.latestRejectionReason && (
                          <p className="text-xs text-red-600 dark:text-red-400">
                            Last rejected reason: {parentFine.latestRejectionReason}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-red-600 dark:text-red-400 ml-4">
                        ₱{fine.amount.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {fines.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No outstanding fines</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment Summary */}
        <Card className="sticky bottom-4 shadow-lg border-2">
          <CardHeader className="pb-4">
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {payFees && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Membership Fees ({payableFees.length} item{payableFees.length > 1 ? "s" : ""})
                  </span>
                  <span className="font-medium">₱{feesPayableTotal.toFixed(2)}</span>
                </div>
              )}
              {payFines && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Fines & Penalties ({payableFines.length} item{payableFines.length > 1 ? "s" : ""})
                  </span>
                  <span className="font-medium">₱{finesPayableTotal.toFixed(2)}</span>
                </div>
              )}
              {!hasSelection && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No items selected yet. Please select fees, fines, or both to continue.
                </div>
              )}
            </div>

            {hasSelection && (
              <>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Amount</span>
                  <span className="text-2xl font-bold text-[#1B5E20] dark:text-[#8BC34A]">
                    ₱{grandTotal.toFixed(2)}
                  </span>
                </div>
              </>
            )}

          </CardContent>
        </Card>

        <div className="fixed inset-x-0 bottom-0 z-[60] border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] shadow-lg">
          <div className="mx-auto max-w-5xl flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Total Amount</p>
              <p className="text-lg font-bold text-[#1B5E20] dark:text-[#8BC34A]">₱{grandTotal.toFixed(2)}</p>
            </div>
            <Button
              onClick={handleContinue}
              disabled={!hasSelection}
              className="bg-[#1B5E20] hover:bg-[#2E7D32] text-white dark:bg-[#1B5E20] dark:hover:bg-[#2E7D32]"
            >
              Continue to Payment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}