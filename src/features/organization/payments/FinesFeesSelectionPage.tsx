"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Receipt, AlertCircle, CheckCircle2, Building2 } from "lucide-react";

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

interface FeeItem {
  id: string;
  description: string;
  amount: number;
  dueDate?: string;
}

interface FineItem {
  id: string;
  description: string;
  amount: number;
  date?: string;
  reason: string;
}

interface FinesFeesSelectionPageProps {
  studentData: StudentData;
  organizationData: OrganizationData;
  fees: FeeItem[];
  fines: FineItem[];
  onBack: () => void;
  onNext: (selectedItems: {
    fees: string[];
    fines: string[];
    feeAmount: number;
    fineAmount: number;
    totalAmount: number;
  }) => void;
}

export default function FinesFeesSelectionPage({
  studentData,
  organizationData,
  fees,
  fines,
  onBack,
  onNext,
}: FinesFeesSelectionPageProps) {
  const [payFees, setPayFees] = useState(false);
  const [payFines, setPayFines] = useState(false);

  const formatDisplayDate = (value?: string) => {
    if (!value) return null;
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

  const grandTotal = (payFees ? feesTotal : 0) + (payFines ? finesTotal : 0);

  const handleContinue = () => {
    if (payFees || payFines) {
      onNext({
        fees: payFees ? fees.map((fee) => fee.id) : [],
        fines: payFines ? fines.map((fine) => fine.id) : [],
        feeAmount: payFees ? feesTotal : 0,
        fineAmount: payFines ? finesTotal : 0,
        totalAmount: grandTotal,
      });
    }
  };

  const hasSelection = payFees || payFines;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back Button */}
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Organization Selection
        </Button>

        {/* Student & Organization Info Banner */}
        <Card className="border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-green-600 dark:text-green-400" />
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
                    className={`flex items-center space-x-2 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                      payFees
                        ? "bg-blue-50 dark:bg-blue-950/20 border-blue-500 dark:border-blue-600"
                        : "bg-muted/50 border-border hover:bg-muted"
                    }`}
                    onClick={() => setPayFees(!payFees)}
                  >
                    <Checkbox
                      id="pay-all-fees"
                      checked={payFees}
                      onCheckedChange={(checked) => {
                        setPayFees(checked === true);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-sm font-semibold leading-none flex-1">
                      Pay All Fees
                    </span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      ₱{feesTotal.toFixed(2)}
                    </span>
                  </div>
                  <Separator />
                  <p className="text-xs text-muted-foreground px-1">Fee Breakdown:</p>
                </>
              )}

              {/* Fee Items Breakdown (Read-only) */}
              <div className="space-y-2">
                {fees.map((fee) => (
                  <div
                    key={fee.id}
                    className="flex items-start justify-between p-3 rounded-lg bg-card border"
                  >
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{fee.description}</p>
                      {fee.dueDate && (
                        <p className="text-xs text-muted-foreground">Due: {fee.dueDate}</p>
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
                    className={`flex items-center space-x-2 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                      payFines
                        ? "bg-red-50 dark:bg-red-950/20 border-red-500 dark:border-red-600"
                        : "bg-muted/50 border-border hover:bg-muted"
                    }`}
                    onClick={() => setPayFines(!payFines)}
                  >
                    <Checkbox
                      id="pay-all-fines"
                      checked={payFines}
                      onCheckedChange={(checked) => {
                        setPayFines(checked === true);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-sm font-semibold leading-none flex-1">
                      Pay All Fines
                    </span>
                    <span className="text-lg font-bold text-red-600 dark:text-red-400">
                      ₱{finesTotal.toFixed(2)}
                    </span>
                  </div>
                  <Separator />
                  <p className="text-xs text-muted-foreground px-1">Fines Breakdown:</p>
                </>
              )}

              {/* Fine Items Breakdown (Read-only) */}
              <div className="space-y-2">
                {fines.map((fine) => (
                  <div
                    key={fine.id}
                    className="flex items-start justify-between p-3 rounded-lg bg-card border"
                  >
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{fine.description}</p>
                      {formatDisplayDate(fine.date) && (
                        <p className="text-xs text-muted-foreground">Date: {formatDisplayDate(fine.date)}</p>
                      )}
                      <p className="text-xs text-muted-foreground italic">{fine.reason}</p>
                    </div>
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400 ml-4">
                      ₱{fine.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
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
                    Membership Fees ({fees.length} item{fees.length > 1 ? "s" : ""})
                  </span>
                  <span className="font-medium">₱{feesTotal.toFixed(2)}</span>
                </div>
              )}
              {payFines && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Fines & Penalties ({fines.length} item{fines.length > 1 ? "s" : ""})
                  </span>
                  <span className="font-medium">₱{finesTotal.toFixed(2)}</span>
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
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ₱{grandTotal.toFixed(2)}
                  </span>
                </div>
              </>
            )}

            <Button
              onClick={handleContinue}
              disabled={!hasSelection}
              className="w-full"
              size="lg"
            >
              Continue to Payment
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}