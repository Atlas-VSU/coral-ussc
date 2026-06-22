"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, CalendarDays, ChevronRight, Loader2, UserCircle } from "lucide-react";
import { PaymentBrandHeader } from "./components/PaymentBrandHeader";
import { PaymentProgressBar } from "./components/PaymentProgressBar";
import { ResponsiveProgramText } from "./components/ResponsiveProgramText";
import { StudentData } from "@/app/(public)/payment/page";

interface Term {
  id: string;
  AY: string;
  semester: string;
  displayName: string;
  isActive?: boolean;
}

interface TermsSelectionPageProps {
  studentData: StudentData;
  currentStep: 1 | 2 | 3 | 4 | 5;
  onBack: () => void;
  onNext: (selectedTerm: { AY: string; semester: string }) => void;
}

export default function TermsSelectionPage({
  studentData,
  currentStep,
  onBack,
  onNext,
}: TermsSelectionPageProps) {
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const res = await fetch("/api/public/terms");
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to load terms.");
        }

        setTerms(data.terms || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load terms.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchTerms();
  }, []);

  const handleContinue = () => {
    const selected = terms.find((t) => t.id === selectedTermId);
    if (selected) {
      onNext({ AY: selected.AY, semester: selected.semester });
    }
  };

  return (
    <div className="min-h-screen bg-[#1B5E20]/5 dark:bg-background py-8 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <PaymentBrandHeader />
        
        <PaymentProgressBar
          currentStep={currentStep}
          subtitle="Select the academic term you want to pay for"
        />

        {/* Back Button */}
        <Button variant="ghost" onClick={onBack} className="gap-2">
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

        {/* Term Selection */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Select Academic Term</CardTitle>
            <CardDescription>
              Choose the term to view and settle your outstanding dues
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 pt-3 sm:px-6 sm:pt-4">
            {isLoading ? (
              <div className="py-10 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading available terms...
              </div>
            ) : error ? (
              <div className="py-10 text-center space-y-2">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            ) : terms.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <p className="text-sm text-muted-foreground">No payment terms available at the moment.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {terms.map((term) => (
                  <button
                    key={term.id}
                    onClick={() => setSelectedTermId(term.id)}
                    className={`w-full text-left p-3 sm:p-4 rounded-lg border-2 transition-all hover:border-[#1B5E20]/50 hover:bg-[#1B5E20]/5 ${
                      selectedTermId === term.id
                        ? "border-[#1B5E20] bg-[#1B5E20]/5"
                        : "border-border bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#1B5E20]/10 shrink-0">
                          <CalendarDays className="h-5 w-5 text-[#1B5E20] dark:text-[#8BC34A]" />
                        </div>
                        <div className="flex flex-col min-[450px]:flex-row min-[450px]:items-center gap-1 sm:gap-2">
                          <p className="font-semibold text-base text-foreground">
                            {term.displayName}
                          </p>
                          {term.isActive && (
                            <span className="inline-flex w-fit items-center rounded bg-[#1B5E20]/10 px-2 py-0.5 text-[10px] font-medium text-[#1B5E20] dark:bg-[#8BC34A]/20 dark:text-[#8BC34A]">
                              Current Term
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight
                        className={`h-5 w-5 shrink-0 transition-transform ${
                          selectedTermId === term.id ? "text-[#1B5E20] dark:text-[#8BC34A]" : "text-muted-foreground"
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
            disabled={!selectedTermId || isLoading}
            size="lg"
            variant="success"
            className="w-full min-[400px]:w-auto gap-2"
          >
            View Organizations
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}