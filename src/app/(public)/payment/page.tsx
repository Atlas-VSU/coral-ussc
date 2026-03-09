"use client";

import { useState } from "react";
import StudentVerificationPage from "@/features/organization/payments/StudentVerificationPage";
import OrganizationSelectionPage from "@/features/organization/payments/OrganizationSelectionPage";

type PaymentStep = "verification" | "organization" | "fees" | "payment";

interface StudentData {
  studentId: string;
  program: string;
  name: string;
}

export default function PaymentPage() {
  const [currentStep, setCurrentStep] = useState<PaymentStep>("verification");
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

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
    // TODO: Navigate to fees page
  };

  const handleBackToOrganization = () => {
    setCurrentStep("organization");
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
      {/* TODO: Add fees and payment pages */}
    </>
  );
}
