"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, ChevronRight, Loader2 } from "lucide-react";

interface StudentData {
  studentId: string;
  program: string;
  name: string;
}

interface Organization {
  id: string;
  name: string;
  acronym: string;
  outstandingAmount: number;
  description?: string;
}

interface OrganizationSelectionPageProps {
  studentData: StudentData;
  organizations: Organization[];
  isLoading?: boolean;
  error?: string | null;
  onBack: () => void;
  onNext: (organizationId: string) => void;
}

export default function OrganizationSelectionPage({
  studentData,
  organizations,
  isLoading = false,
  error = null,
  onBack,
  onNext,
}: OrganizationSelectionPageProps) {
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);

  const handleOrgSelect = (orgId: string) => {
    setSelectedOrg(orgId);
  };

  const handleContinue = () => {
    if (selectedOrg) {
      onNext(selectedOrg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={onBack}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Student Verification
        </Button>

        {/* Student Info Banner */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Student Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>{" "}
                <span className="font-medium">{studentData.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Student ID:</span>{" "}
                <span className="font-medium">{studentData.studentId}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Program:</span>{" "}
                <span className="font-medium">{studentData.program}</span>
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
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="py-10 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading organizations with outstanding dues...
              </div>
            ) : organizations.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <p className="text-sm text-muted-foreground">No outstanding dues found for this student.</p>
                {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
              </div>
            ) : (
              <div className="space-y-3">
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => handleOrgSelect(org.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:border-primary/50 hover:bg-accent/50 ${
                      selectedOrg === org.id
                        ? "border-primary bg-accent"
                        : "border-border bg-card"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 rounded-lg bg-primary/10 mt-1">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-base">
                              {org.name}
                            </h3>
                            <Badge variant="secondary" className="text-xs">
                              {org.acronym}
                            </Badge>
                          </div>
                          {org.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {org.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              Outstanding Balance:
                            </span>
                            <span
                              className={`font-semibold ${
                                org.outstandingAmount > 0
                                  ? "text-destructive"
                                  : "text-green-600 dark:text-green-400"
                              }`}
                            >
                              ₱{org.outstandingAmount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight
                        className={`h-5 w-5 mt-1 transition-transform ${
                          selectedOrg === org.id ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Continue Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleContinue}
            disabled={!selectedOrg || isLoading || organizations.length === 0}
            size="lg"
            className="gap-2"
          >
            Continue to Fees Selection
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}