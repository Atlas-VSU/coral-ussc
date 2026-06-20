"use client";

import { useMemo, useState } from "react";
import StudentVerificationPage from "@/features/organization/payments/StudentVerificationPage";
import TermsSelectionPage from "@/features/organization/payments/TermsSelectionPage"; // <-- NEW IMPORT
import OrganizationSelectionPage from "@/features/organization/payments/OrganizationSelectionPage";
import FinesFeesSelectionPage from "@/features/organization/payments/FinesFeesSelectionPage";
import { Timestamp } from "firebase/firestore";
import FinesPaymentFormPage from "@/features/organization/payments/FinesPaymentFormPage.ts";

// 1. ADDED "term" TO THE STEPS
type PaymentStep = "verification" | "term" | "organization" | "fees" | "payment";

export interface StudentData {
  studentId: string;
  program: string;
  name: string;
  programShortName?: string;
  programAcronym?: string;
}

export interface OrganizationData {
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

  orgTreasurerName?: string;
  orgTreasurerUrl?: string;
  orgAuditorName?: string;
  orgAuditorUrl?: string;
}

export interface FeeItem {
  id: string;
  description: string;
  title: string;
  amount: number;
  dueDate?: string;
  latestRejectionReason?: string;
  isPayable?: boolean;
  academicYear?: string;
  semester?: string;
  paymentState?: "unpaid" | "pending" | "rejected";
}

export interface FineItem {
  refId: string,
  title: string,
  amount: number,
  parentFineId: string,
  isPaid: boolean,
  isPending: boolean,
  date: Timestamp,
  academicYear?: string,
  semester?: string,
}

export interface Fine {
  id: string;
  description: string;
  amount: number;
  date?: string;
  reason: string;
  latestRejectionReason?: string;
  isPayable?: boolean;
  paymentState?: "unpaid" | "pending" | "rejected";
}

interface OrganizationDueData extends OrganizationData {
  feeAmount: number;
  fineAmount: number;
  paymentSummary?: {
    pending: number;
    verified: number;
    rejected: number;
    unpaid: number;
  };
  fees: FeeItem[];
  fines: Fine[];
  fineItems: FineItem[];
}

export interface SelectedPaymentItems {
  fees: FeeItem[];
  fines: Fine[];
  fineItems: FineItem[];
  feeAmount: number;
  fineAmount: number;
  totalAmount: number;
}


export default function PaymentPage() {
  const [currentStep, setCurrentStep] = useState<PaymentStep>("verification");
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  
  // 2. NEW STATE FOR SELECTED TERM
  const [selectedTerm, setSelectedTerm] = useState<{ AY: string; semester: string } | null>(null);
  
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [organizationDues, setOrganizationDues] = useState<OrganizationDueData[]>([]);
  const [isLoadingDues, setIsLoadingDues] = useState(false);
  const [duesError, setDuesError] = useState<string | null>(null);
  const [selectedPaymentItems, setSelectedPaymentItems] = useState<SelectedPaymentItems | null>(null);

  const selectedOrganization = useMemo(() => {
    return organizationDues.find((org) => org.id === selectedOrgId) || null;
  }, [organizationDues, selectedOrgId]);

  const getOrganizationStatusStates = (org: OrganizationDueData) => {
    const states = new Set<"unpaid" | "pending" | "rejected" | "verified">();

    for (const fee of org.fees) {
      states.add(fee.paymentState ?? "unpaid");
    }

    for (const fine of org.fines) {
      if (org.fineItems.length > 0) {
        states.add(fine.paymentState ?? "unpaid");
      }
    }

    const orderedStates: Array<"pending" | "verified" | "rejected" | "unpaid"> = [
      "pending",
      "verified",
      "rejected",
      "unpaid",
    ];

    return orderedStates.filter((state) => states.has(state));
  };

  // 3. UPDATED TO ACCEPT AY AND SEMESTER
  const loadStudentDues = async (studentId: string, AY: string, semester: string) => {
    setIsLoadingDues(true);
    setDuesError(null);

    try {
      const response = await fetch(
        `/api/public/student-dues?studentId=${encodeURIComponent(studentId)}&AY=${encodeURIComponent(AY)}&semester=${encodeURIComponent(semester)}`
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
          paymentSummary: org.paymentSummary ?? { pending: 0, verified: 0, rejected: 0, unpaid: 0 },
          feeAmount: Number(org.feeAmount ?? 0),
          fineAmount: Number(org.fineAmount ?? 0),
          fees: Array.isArray(org.fees) ? org.fees : [],
          fines: Array.isArray(org.fines) ? org.fines : [],
          fineItems: Array.isArray(org.fineItems) ? org.fineItems : [],
          orgTreasurerName: org.orgTreasurerName,
          orgTreasurerUrl: org.orgTreasurerUrl,
          orgAuditorName: org.orgAuditorName,
          orgAuditorUrl: org.orgAuditorUrl,
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

  // 4. NAVIGATION HANDLERS UPDATED
  const handleStudentVerified = async (data: StudentData) => {
    setStudentData(data);
    setSelectedTerm(null);
    setSelectedOrgId(null);
    setSelectedPaymentItems(null);
    // Move to term selection instead of organization
    setCurrentStep("term");
  };

  const handleTermSelected = async (term: { AY: string; semester: string }) => {
    setSelectedTerm(term);
    setSelectedOrgId(null);
    setSelectedPaymentItems(null);
    
    // Fetch the dues explicitly for the term selected
    if (studentData) {
      await loadStudentDues(studentData.studentId, term.AY, term.semester);
    }
    setCurrentStep("organization");
  };

  const handleBackToVerification = () => {
    setSelectedTerm(null);
    setSelectedOrgId(null);
    setSelectedPaymentItems(null);
    setCurrentStep("verification");
  };

  const handleBackToTerm = () => {
    setSelectedOrgId(null);
    setSelectedPaymentItems(null);
    setCurrentStep("term");
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
        <StudentVerificationPage onVerified={handleStudentVerified} currentStep={1} />
      )}
      
      {/* 5. NEW TERM SELECTION STEP */}
      {currentStep === "term" && studentData && (
        <TermsSelectionPage
          currentStep={2}
          studentData={studentData}
          onBack={handleBackToVerification}
          onNext={handleTermSelected}
        />
      )}

      {currentStep === "organization" && studentData && (
        <OrganizationSelectionPage
          studentData={studentData}
          organizations={organizationDues.map((org) => ({
            id: org.id,
            name: org.name,
            acronym: org.acronym,
            outstandingAmount: org.outstandingAmount,
            statusStates: getOrganizationStatusStates(org),
            paymentSummary: org.paymentSummary,
          }))}
          currentStep={3}
          isLoading={isLoadingDues}
          error={duesError}
          onBack={handleBackToTerm}
          onNext={handleOrganizationSelected}
        />
      )}
      {currentStep === "fees" && studentData && selectedOrganization && (
        <FinesFeesSelectionPage
          studentData={studentData}
          organizationData={selectedOrganization}
          currentStep={4}
          fees={selectedOrganization.fees}
          fines={selectedOrganization.fines}
          fineItems={selectedOrganization.fineItems}
          onBack={handleBackToOrganization}
          onNext={handleFeesSelected}
        />
      )}
      {currentStep === "payment" && studentData && selectedOrganization && selectedPaymentItems && (
        <FinesPaymentFormPage
          studentData={studentData}
          organizationData={selectedOrganization}
          selectedPaymentItems={selectedPaymentItems}
          currentStep={5}
          onBack={handleBackToFees}
          onRestart={handleBackToVerification}
        />
      )}
    </>
  );
}