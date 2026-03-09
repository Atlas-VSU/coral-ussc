"use client";

import { useState, useMemo } from "react";
import StudentVerificationPage from "@/features/organization/payments/StudentVerificationPage";
import OrganizationSelectionPage from "@/features/organization/payments/OrganizationSelectionPage";
import FinesFeesSelectionPage from "@/features/organization/payments/FinesFeesSelectionPage";

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
  const [selectedPaymentItems, setSelectedPaymentItems] = useState<{
    fees: string[];
    fines: string[];
    totalAmount: number;
  } | null>(null);

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

  const handleFeesSelected = (items: { fees: string[]; fines: string[]; totalAmount: number }) => {
    setSelectedPaymentItems(items);
    setCurrentStep("payment");
    // TODO: Navigate to payment submission page
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
      {/* TODO: Add payment submission page */}
    </>
  );
}
