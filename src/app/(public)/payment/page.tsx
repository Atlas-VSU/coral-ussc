"use client";

import { useState, useMemo } from "react";
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
}

interface SelectedPaymentItems {
  fees: string[];
  fines: string[];
  feeAmount: number;
  fineAmount: number;
  totalAmount: number;
}

// Mock organization data - should match OrganizationSelectionPage
const ORGANIZATIONS: OrganizationData[] = [
  {
    id: "org-1",
    name: "University Student Supreme Council",
    acronym: "USSC",
  },
  {
    id: "org-2",
    name: "Computer Science Society",
    acronym: "CSS",
  },
  {
    id: "org-3",
    name: "Engineering Students Organization",
    acronym: "ESO",
  },
];

export default function PaymentPage() {
  const [currentStep, setCurrentStep] = useState<PaymentStep>("verification");
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedPaymentItems, setSelectedPaymentItems] = useState<SelectedPaymentItems | null>(null);

  const selectedOrganization = useMemo(() => {
    return ORGANIZATIONS.find((org) => org.id === selectedOrgId) || null;
  }, [selectedOrgId]);

  const handleStudentVerified = (data: StudentData) => {
    setStudentData(data);
    setCurrentStep("organization");
  };

  const handleBackToVerification = () => {
    setCurrentStep("verification");
  };

  const handleOrganizationSelected = (organizationId: string) => {
    setSelectedOrgId(organizationId);
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
          onBack={handleBackToVerification}
          onNext={handleOrganizationSelected}
        />
      )}
      {currentStep === "fees" && studentData && selectedOrganization && (
        <FinesFeesSelectionPage
          studentData={studentData}
          organizationData={selectedOrganization}
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
        />
      )}
    </>
  );
}
