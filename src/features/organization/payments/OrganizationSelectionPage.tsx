"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, Building2, ChevronRight, Loader2, UserCircle } from "lucide-react";
import { PaymentBrandHeader } from "./components/PaymentBrandHeader";
import { PaymentProgressBar } from "./components/PaymentProgressBar";
import { ResponsiveProgramText } from "./components/ResponsiveProgramText";

interface StudentData {
  studentId: string;
  program: string;
  name: string;
  programShortName?: string;
  programAcronym?: string;
}

interface Organization {
  id: string;
  name: string;
  acronym: string;
  outstandingAmount: number;
  statusStates?: Array<"unpaid" | "pending" | "rejected" | "verified">;
  paymentSummary?: {
    pending: number;
    verified: number;
    rejected: number;
    unpaid: number;
  };
  description?: string;
}

const getStatusBadge = (status: "unpaid" | "pending" | "rejected" | "verified") => {
  switch (status) {
    case "pending":
      return {
        label: "Pending review",
        className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300",
      };
    case "verified":
      return {
        label: "Verified by admin",
        className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300",
      };
    case "rejected":
      return {
        label: "Rejected",
        className: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300",
      };
    case "unpaid":
    default:
      return {
        label: "Unpaid",
        className: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300",
      };
  }
};

interface OrganizationSelectionPageProps {
  studentData: StudentData;
  organizations: Organization[];
  currentStep: 1 | 2 | 3 | 4;
  isLoading?: boolean;
  error?: string | null;
  onBack: () => void;
  onNext: (organizationId: string) => void;
}

export default function OrganizationSelectionPage({
  studentData,
  organizations,
  currentStep,
  isLoading = false,
  error = null,
  onBack,
  onNext,
}: OrganizationSelectionPageProps) {
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);

  const isOrganizationPayable = (organization: Organization) => {
    const summary = organization.paymentSummary;
    if (summary) {
      return summary.unpaid > 0 || summary.rejected > 0;
    }

    const states = organization.statusStates ?? [];
    return states.includes("unpaid") || states.includes("rejected");
  };

  const hasPayableOrganizations = organizations.some((organization) => isOrganizationPayable(organization));

  const handleOrgSelect = (orgId: string) => {
    const org = organizations.find((organization) => organization.id === orgId);
    if (!org || !isOrganizationPayable(org)) {
      return;
    }

    setSelectedOrg(orgId);
  };

  const handleContinue = () => {
    if (!hasPayableOrganizations) {
      onBack();
      return;
    }

    if (selectedOrg) {
      onNext(selectedOrg);
    }
  };

  return (
    <div className="min-h-screen bg-[#1B5E20]/5 dark:bg-background py-8 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <PaymentBrandHeader />
        <PaymentProgressBar
          currentStep={currentStep}
          subtitle="Choose the organization you want to settle dues with"
        />
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={onBack}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="min-[400px]:hidden">Back</span>
          <span className="hidden min-[400px]:inline">Back to Student Verification</span>
        </Button>

        {/* Student Info Banner */}
        <Card className="border-[#1B5E20]/20 dark:border-[#1B5E20]/30 bg-[#1B5E20]/5 dark:bg-[#1B5E20]/10">
          <CardContent className="px-3 py-3 sm:px-6 sm:py-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1B5E20]/15 dark:bg-[#1B5E20]/25">
                <UserCircle className="h-6 w-6 text-[#1B5E20] dark:text-[#8BC34A]" />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="font-semibold text-base leading-tight truncate">{studentData.name}</p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
                  <span className="font-mono font-medium text-foreground/80">{studentData.studentId}</span>
                  <span className="text-muted-foreground/50">•</span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5 shrink-0" />
                    <ResponsiveProgramText
                      fullName={studentData.program}
                      shortName={studentData.programShortName}
                      acronym={studentData.programAcronym}
                    />
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organization Selection */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Select Organization</CardTitle>
            <CardDescription>
              Choose the organization you want to pay fees or fines for
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 pt-3 sm:px-6 sm:pt-4">
            {isLoading ? (
              <div className="py-10 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading organizations...
              </div>
            ) : organizations.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <p className="text-sm text-muted-foreground">No organization payment records found for this student.</p>
                {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
              </div>
            ) : (
              <div className="space-y-3">
                {organizations.map((org) => (
                  (() => {
                    const isPayable = isOrganizationPayable(org);

                    return (
                      <button
                        key={org.id}
                        onClick={() => handleOrgSelect(org.id)}
                        disabled={!isPayable}
                        className={`w-full text-left p-3 sm:p-4 rounded-lg border-2 transition-all ${
                          isPayable
                            ? "hover:border-[#1B5E20]/50 hover:bg-[#1B5E20]/5"
                            : "opacity-70 cursor-not-allowed"
                        } ${
                          selectedOrg === org.id && isPayable
                            ? "border-[#1B5E20] bg-[#1B5E20]/5"
                            : "border-border bg-card"
                        }`}
                      >
                    <div className="flex items-start justify-between gap-2 sm:gap-4">
                      <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="p-1.5 sm:p-2 rounded-lg bg-[#1B5E20]/10 mt-1 shrink-0">
                          <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-[#1B5E20] dark:text-[#8BC34A]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="mb-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <h3 className="font-semibold text-sm leading-tight sm:text-base break-words">
                              {org.name}
                            </h3>
                            <Badge variant="secondary" className="text-[10px] sm:text-xs shrink-0">
                              {org.acronym}
                            </Badge>
                            {(() => {
                              const summaryStates: Array<"unpaid" | "pending" | "rejected" | "verified"> = org.statusStates && org.statusStates.length > 0
                                ? org.statusStates
                                : org.outstandingAmount > 0 || (org.paymentSummary?.unpaid ?? 0) > 0
                                  ? ["unpaid"]
                                  : [];

                              return summaryStates.map((status) => {
                                const badge = getStatusBadge(status);

                                return (
                                  <Badge
                                    key={status}
                                    variant="outline"
                                    className={`text-[10px] sm:text-xs shrink-0 ${badge.className}`}
                                  >
                                    {badge.label}
                                  </Badge>
                                );
                              });
                            })()}
                          </div>
                          {org.description && (
                            <p className="mb-2 text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">
                              {org.description}
                            </p>
                          )}
                          <div className="flex flex-col gap-0.5 min-[380px]:flex-row min-[380px]:items-center min-[380px]:gap-2">
                            <span className="text-xs sm:text-sm text-muted-foreground">
                              Outstanding Balance:
                            </span>
                            <span
                              className={`text-base font-semibold ${
                                org.outstandingAmount > 0
                                  ? "text-destructive"
                                  : "text-[#1B5E20] dark:text-[#8BC34A]"
                              }`}
                            >
                              ₱{org.outstandingAmount.toFixed(2)}
                            </span>
                          </div>
                          {org.paymentSummary && (org.paymentSummary.pending > 0 || org.paymentSummary.verified > 0 || org.paymentSummary.rejected > 0) && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              {org.paymentSummary.pending > 0 && `${org.paymentSummary.pending} pending`}
                              {org.paymentSummary.pending > 0 && org.paymentSummary.verified > 0 ? " · " : ""}
                              {org.paymentSummary.verified > 0 && `${org.paymentSummary.verified} verified`}
                              {(org.paymentSummary.pending > 0 || org.paymentSummary.verified > 0) && org.paymentSummary.rejected > 0 ? " · " : ""}
                              {org.paymentSummary.rejected > 0 && `${org.paymentSummary.rejected} rejected`}
                            </p>
                          )}
                          {!isPayable && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              No payment needed for now. Current submissions are pending or already verified.
                            </p>
                          )}
                        </div>
                      </div>
                      <ChevronRight
                        className={`mt-1 hidden h-5 w-5 shrink-0 min-[400px]:block transition-transform ${
                          selectedOrg === org.id && isPayable ? "text-[#1B5E20] dark:text-[#8BC34A]" : "text-muted-foreground"
                        }`}
                      />
                    </div>
                      </button>
                    );
                  })()
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Continue Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleContinue}
            disabled={isLoading || organizations.length === 0 || (hasPayableOrganizations && !selectedOrg)}
            size="lg"
            className="w-full min-[400px]:w-auto gap-2 bg-[#1B5E20] hover:bg-[#2E7D32] text-white dark:bg-[#1B5E20] dark:hover:bg-[#2E7D32]"
          >
            {hasPayableOrganizations ? "Continue to Fees Selection" : "Exit"}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}