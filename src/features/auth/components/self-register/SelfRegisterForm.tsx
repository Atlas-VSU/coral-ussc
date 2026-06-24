"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";

import {
  selfRegisterSchema,
  FRESHMAN_YEAR_LEVEL,
  type SelfRegisterFormData,
} from "./constants";
import { useProgramOptions } from "./hooks/useProgramOptions";
import { RegistrationSuccess } from "./components/RegistrationSuccess";
import { PersonalInfoFields } from "./components/PersonalInfoFields";
import { ProgramSelectField } from "./components/ProgramSelectField";
import { YearLevelDisplay } from "./components/YearLevelDisplay";
import { CORUploadPlaceholder } from "./components/CORUploadPlaceholder";
import { RecaptchaSection } from "./components/RecaptchaSection";
import { FormActions } from "./components/FormActions";

interface SelfRegisterFormProps {
  initialEmail?: string;
  token?: string;
}

export function SelfRegisterForm({ initialEmail = "", token = "" }: SelfRegisterFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  // When reCAPTCHA isn't configured, don't block submission on a token that can
  // never arrive — the captcha just becomes unavailable.
  const recaptchaConfigured = Boolean(
    process.env.NEXT_PUBLIC_RECAPTCHA_V2_SITE_KEY
  );
  const recaptchaVerified = recaptchaConfigured ? Boolean(recaptchaToken) : true;

  const { programOptions, isLoadingPrograms, programLoadError } =
    useProgramOptions();

  const form = useForm<SelfRegisterFormData>({
    resolver: zodResolver(selfRegisterSchema),
    defaultValues: {
      studentId: "",
      email: initialEmail,
      firstName: "",
      lastName: "",
      programId: "",
    },
  });

  const onSubmit = async (data: SelfRegisterFormData) => {
    if (recaptchaConfigured && !recaptchaToken) {
      toast.error("Please complete the reCAPTCHA verification.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/public/add-student", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          yearLevel: FRESHMAN_YEAR_LEVEL,
          role: "user",
          recaptchaToken: recaptchaToken,
          registrationToken: token,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Registration failed");
      }
      setIsSubmitting(false);
      setSubmitted(true);
      toast.success("Registration submitted! Your application is pending review.");
    } catch (e: any) {
      console.error("Registration error:", e);
      toast.error(e.message || "Registration failed");
      setIsSubmitting(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (submitted) {
    return <RegistrationSuccess />;
  }

  // ── Form state ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#1B5E20]/5 dark:bg-background flex flex-col items-center justify-center p-2 sm:p-4 py-6 sm:py-10">
      {/* Brand header */}
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <Image
          src="/images/ussc-logo-1.webp"
          alt="USSC logo"
          width={64}
          height={64}
          className="h-16 w-16 object-contain"
          priority
        />
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[#8BC34A] via-[#2E7D32] to-[#1B5E20] bg-clip-text text-transparent">
          Freshman Self-Registration
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Fill out the form below to register. Your
          details will be reviewed and verified before your membership is
          activated.
        </p>
      </div>

      <Card className="w-full max-w-2xl shadow-sm bg-white text-black border !border-[#2E7D32]/20 p-0">
        <CardContent className="px-4 sm:px-6 py-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <PersonalInfoFields form={form} emailReadOnly={Boolean(initialEmail)} />
                <ProgramSelectField
                  form={form}
                  programOptions={programOptions}
                  isLoadingPrograms={isLoadingPrograms}
                  programLoadError={programLoadError}
                />
                {/* Year level is fixed — self-registration is for freshmen only */}
                <YearLevelDisplay />
              </div>

              {/* Certificate of Registration upload — Coming Soon */}
              <CORUploadPlaceholder />

              {/* reCAPTCHA v2 — must be solved before submitting */}
              <RecaptchaSection
                onVerify={setRecaptchaToken}
                onExpire={() => setRecaptchaToken(null)}
              />

              <FormActions
                isSubmitting={isSubmitting}
                recaptchaVerified={recaptchaVerified}
              />
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
