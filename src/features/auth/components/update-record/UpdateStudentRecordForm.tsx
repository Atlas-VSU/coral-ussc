"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { RecaptchaSection } from "@/features/auth/components/self-register/components/RecaptchaSection";
import { useUpdateProgramOptions } from "./hooks/useUpdateProgramOptions";
import {
  updateRecordSchema,
  UpdateRecordFormData,
  YEAR_LEVELS,
  formatYearLevel,
  lightInputClass,
  lightSelectTriggerClass,
  lightSelectContentClass,
  lightSelectItemClass,
} from "./constants";

interface UpdateStudentRecordFormProps {
  token: string;
  studentId: string;
  email: string;
  initialValues: {
    firstName: string;
    lastName: string;
    programId: string;
    yearLevel: number;
  };
}

export function UpdateStudentRecordForm({
  token,
  studentId,
  email,
  initialValues,
}: UpdateStudentRecordFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  const recaptchaConfigured = Boolean(process.env.NEXT_PUBLIC_RECAPTCHA_V2_SITE_KEY);
  const recaptchaVerified = recaptchaConfigured ? Boolean(recaptchaToken) : true;

  const { programOptions, isLoadingPrograms, programLoadError } = useUpdateProgramOptions();

  const form = useForm<UpdateRecordFormData>({
    resolver: zodResolver(updateRecordSchema),
    defaultValues: {
      firstName: initialValues.firstName,
      lastName: initialValues.lastName,
      programId: initialValues.programId,
      yearLevel: initialValues.yearLevel ?? 1,
    },
  });

  const onSubmit = async (data: UpdateRecordFormData) => {
    if (recaptchaConfigured && !recaptchaToken) {
      toast.error("Please complete the reCAPTCHA verification.");
      return;
    }
    if (!agreed) {
      toast.error("Please accept the consent before submitting.");
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await fetch("/api/public/update-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          firstName: data.firstName,
          lastName: data.lastName,
          programId: data.programId,
          yearLevel: data.yearLevel,
          recaptchaToken: recaptchaToken ?? "",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Update failed.");
      }

      setSubmitted(true);
      toast.success("Your record has been updated successfully!");
    } catch (e: any) {
      toast.error(e.message || "Update failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#1B5E20]/5 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-sm bg-white text-black border !border-[#2E7D32]/20 p-0">
          <CardContent className="px-6 py-10 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-[#1B5E20]">Record Updated!</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Your student record has been successfully updated. If you have any
              questions, please contact your organization officer.
            </p>
          </CardContent>
        </Card>
      </div>
    );
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
          Update Student Record
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Review and update your information below. Your student ID and email
          cannot be changed here.
        </p>
      </div>

      <Card className="w-full max-w-2xl shadow-sm bg-white text-black border !border-[#2E7D32]/20 p-0">
        <CardContent className="px-4 sm:px-6 py-6">
          {/* Read-only fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
            <div className="space-y-1">
              <Label className="text-[#1B5E20] font-semibold text-sm">
                Student ID
              </Label>
              <Input
                value={studentId}
                readOnly
                className={`${lightInputClass} !bg-gray-100 cursor-not-allowed opacity-80`}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[#1B5E20] font-semibold text-sm">
                Email
              </Label>
              <Input
                value={email}
                readOnly
                className={`${lightInputClass} !bg-gray-100 cursor-not-allowed opacity-80`}
              />
            </div>
          </div>

          {/* Editable fields */}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* First Name */}
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#1B5E20] font-semibold">
                        First Name
                      </FormLabel>
                      <FormControl>
                        <Input {...field} className={lightInputClass} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Last Name */}
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#1B5E20] font-semibold">
                        Last Name
                      </FormLabel>
                      <FormControl>
                        <Input {...field} className={lightInputClass} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Program */}
                <FormField
                  control={form.control}
                  name="programId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#1B5E20] font-semibold">
                        Program
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isLoadingPrograms}
                      >
                        <FormControl>
                          <SelectTrigger className={lightSelectTriggerClass}>
                            <SelectValue
                              placeholder={
                                isLoadingPrograms
                                  ? "Loading programs…"
                                  : "Select a program"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className={lightSelectContentClass}>
                          {programOptions.map((p) => (
                            <SelectItem
                              key={p.value}
                              value={p.value}
                              className={lightSelectItemClass}
                            >
                              {p.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {programLoadError && (
                        <p className="text-xs text-amber-600">{programLoadError}</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Year Level */}
                <FormField
                  control={form.control}
                  name="yearLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#1B5E20] font-semibold">
                        Year Level
                      </FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(Number(val))}
                        value={String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger className={lightSelectTriggerClass}>
                            <SelectValue placeholder="Select your year level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className={lightSelectContentClass}>
                          {YEAR_LEVELS.map((level) => (
                            <SelectItem
                              key={level}
                              value={String(level)}
                              className={lightSelectItemClass}
                            >
                              {formatYearLevel(level)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* reCAPTCHA */}
              <RecaptchaSection
                onVerify={setRecaptchaToken}
                onExpire={() => setRecaptchaToken(null)}
              />

              {/* Consent */}
              <div className="bg-[#8BC34A]/5 p-4 rounded-md border !border-[#2E7D32]/30">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="update-consent"
                    checked={agreed}
                    onCheckedChange={(checked) =>
                      setAgreed(checked === true)
                    }
                    className="mt-0.5 !bg-white !border-[#2E7D32]/40 data-[state=checked]:!bg-white data-[state=checked]:!text-[#1B5E20] data-[state=checked]:!border-[#1B5E20]"
                  />
                  <Label
                    htmlFor="update-consent"
                    className="text-xs text-[#2E7D32]/80 leading-relaxed"
                  >
                    I confirm that the information provided is accurate and
                    consent to the update of my student record.
                  </Label>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={isSubmitting || !agreed || !recaptchaVerified}
                className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold disabled:opacity-50"
              >
                {isSubmitting ? "Saving…" : "Save Changes"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
