"use client";

import { useMemo, useState } from "react";
import StudentVerificationPage from "@/features/organization/payments/StudentVerificationPage";
import OrganizationSelectionPage from "@/features/organization/payments/OrganizationSelectionPage";
import FinesFeesSelectionPage from "@/features/organization/payments/FinesFeesSelectionPage";
import FinesPaymentFormPage from "@/features/organization/payments/FinesPaymentFormPage";

type PaymentStep = "verification" | "organization" | "fees" | "payment";

interface StudentData {
  studentId: string;
  program: string;
  name: string;
}

interface OrganizationData {
  id: string;
  name: string;
  acronym: string;
  outstandingAmount: number;
}

interface FeeItem {
  id: string;
  description: string;
  amount: number;
  dueDate?: string;
  latestRejectionReason?: string;
}

interface FineItem {
  id: string;
  description: string;
  amount: number;
  date?: string;
  reason: string;
  latestRejectionReason?: string;
}

interface OrganizationDueData extends OrganizationData {
  feeAmount: number;
  fineAmount: number;
  fees: FeeItem[];
  fines: FineItem[];
}

interface SelectedPaymentItems {
  fees: string[];
  fines: string[];
  feeAmount: number;
  fineAmount: number;
  totalAmount: number;
}

export default function PaymentPage() {
  const [currentStep, setCurrentStep] = useState<PaymentStep>("verification");
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [organizationDues, setOrganizationDues] = useState<OrganizationDueData[]>([]);
  const [isLoadingDues, setIsLoadingDues] = useState(false);
  const [duesError, setDuesError] = useState<string | null>(null);
  const [selectedPaymentItems, setSelectedPaymentItems] = useState<SelectedPaymentItems | null>(null);

  const selectedOrganization = useMemo(() => {
    return organizationDues.find((org) => org.id === selectedOrgId) || null;
  }, [organizationDues, selectedOrgId]);

  const loadStudentDues = async (studentId: string) => {
    setIsLoadingDues(true);
    setDuesError(null);

    try {
      const response = await fetch(
        `/api/public/student-dues?studentId=${encodeURIComponent(studentId)}`
      );
      const result = await response.json();

      if (!response.ok || !result.success || !Array.isArray(result.organizations)) {
        throw new Error(result.error || "Failed to fetch outstanding dues.");
      }

      setOrganizationDues(
        result.organizations.map((org: OrganizationDueData) => ({
          id: org.id,
          name: org.name,
          acronym: org.acronym,
          outstandingAmount: Number(org.outstandingAmount ?? 0),
          feeAmount: Number(org.feeAmount ?? 0),
          fineAmount: Number(org.fineAmount ?? 0),
          fees: Array.isArray(org.fees) ? org.fees : [],
          fines: Array.isArray(org.fines) ? org.fines : [],
        }))
      );
    } catch (error) {
      setOrganizationDues([]);
      setDuesError(
        error instanceof Error
          ? error.message
          : "Unable to load outstanding dues right now."
      );
    } finally {
      setIsLoadingDues(false);
    }
  };

  const handleStudentVerified = async (data: StudentData) => {
    setStudentData(data);
    setSelectedOrgId(null);
    setSelectedPaymentItems(null);
    await loadStudentDues(data.studentId);
    setCurrentStep("organization");
  };

  const handleBackToVerification = () => {
    setSelectedOrgId(null);
    setSelectedPaymentItems(null);
    setCurrentStep("verification");
  };

  const handleOrganizationSelected = (organizationId: string) => {
    setSelectedOrgId(organizationId);
    setSelectedPaymentItems(null);
    setCurrentStep("fees");
  };

  const handleBackToOrganization = () => {
    setCurrentStep("organization");
  };

  const handleFeesSelected = (items: SelectedPaymentItems) => {
    setSelectedPaymentItems(items);
    setCurrentStep("payment");
  };

  const handleBackToFees = () => {
    setCurrentStep("fees");
  };

  return (
    <>
      {currentStep === "verification" && (
        <StudentVerificationPage onVerified={handleStudentVerified} />
      )}
      {currentStep === "organization" && studentData && (
        <OrganizationSelectionPage
          studentData={studentData}
          organizations={organizationDues.map((org) => ({
            id: org.id,
            name: org.name,
            acronym: org.acronym,
            outstandingAmount: org.outstandingAmount,
          }))}
          isLoading={isLoadingDues}
          error={duesError}
          onBack={handleBackToVerification}
          onNext={handleOrganizationSelected}
        />
      )}
      {currentStep === "fees" && studentData && selectedOrganization && (
        <FinesFeesSelectionPage
          studentData={studentData}
          organizationData={selectedOrganization}
          fees={selectedOrganization.fees}
          fines={selectedOrganization.fines}
          onBack={handleBackToOrganization}
          onNext={handleFeesSelected}
        />
      )}
      {currentStep === "payment" && studentData && selectedOrganization && selectedPaymentItems && (
        <FinesPaymentFormPage
          studentData={studentData}
          organizationData={selectedOrganization}
          selectedPaymentItems={selectedPaymentItems}
          onBack={handleBackToFees}
          onRestart={handleBackToVerification}
        />
      )}
    </>
  );
}
