"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Lock,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// ── Mock program options (frontend-only; mirrors the live program list) ──────
const PROGRAM_OPTIONS = [
  { value: "bscs", label: "BS in Computer Science" },
  { value: "bsit", label: "BS in Information Technology" },
  { value: "bsce", label: "BS in Civil Engineering" },
  { value: "bsee", label: "BS in Electrical Engineering" },
  { value: "bsabe", label: "BS in Agricultural & Biosystems Engineering" },
  { value: "bsa", label: "BS in Agriculture" },
  { value: "bsbio", label: "BS in Biology" },
  { value: "bses", label: "BS in Environmental Science" },
] as const;

const selfRegisterSchema = z.object({
  studentId: z
    .string()
    .min(1, "Student ID is required")
    .regex(
      /^\d{2}-\d-\d{5}$/,
      "Student ID must follow format XX-X-XXXXX (e.g., 25-1-12345)"
    ),
  email: z.string().min(5, "Email is required").email("Invalid email"),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  programId: z.string().min(1, "Program is required"),
  yearLevel: z.number().min(1).max(6),
});

type SelfRegisterFormData = z.infer<typeof selfRegisterSchema>;

// Shared light/green field styling to stay consistent with the Add Member form.
const lightInputClass =
  "!bg-white !text-black placeholder:!text-gray-500 !border-[#2E7D32]/30 focus-visible:!ring-green-100";
const lightSelectTriggerClass =
  "!bg-white !text-black !border-[#2E7D32]/30 hover:bg-green-50 focus-visible:!ring-green-100";
const lightSelectContentClass = "bg-white text-black !border-[#2E7D32]/30";
const lightSelectItemClass = "text-black focus:bg-[#8BC34A]/10 focus:text-black";

export function SelfRegisterForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<SelfRegisterFormData>({
    resolver: zodResolver(selfRegisterSchema),
    defaultValues: {
      studentId: "",
      email: "",
      firstName: "",
      lastName: "",
      programId: "",
      yearLevel: 1, // Freshmen default to 1st year
    },
  });

  const onSubmit = async (data: SelfRegisterFormData) => {
    setIsSubmitting(true);
    // Frontend-only mock submission — simulate a short request.
    await new Promise((resolve) => setTimeout(resolve, 900));
    console.log("Self-registration submitted (mock):", data);
    setIsSubmitting(false);
    setSubmitted(true);
    toast.success("Registration submitted! Your application is pending review.");
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#1B5E20]/5 dark:bg-background flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-sm">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-9 w-9 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-[#1B5E20]">
              Registration Submitted
            </h2>
            <p className="text-sm text-muted-foreground">
              Thanks for registering! Your application has been received and is
              now <span className="font-semibold">pending verification</span> by
              your organization. You&apos;ll be notified once it&apos;s reviewed.
            </p>
            <Button asChild variant="success" className="mt-2 w-full">
              <Link href="/">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Form state ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#1B5E20]/5 dark:bg-background flex flex-col items-center justify-center p-4 py-10">
      {/* Brand header */}
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#8BC34A] to-[#1B5E20] text-white shadow-md">
          <GraduationCap className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[#8BC34A] via-[#2E7D32] to-[#1B5E20] bg-clip-text text-transparent">
          Freshman Self-Registration
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          New to the organization? Fill out the form below to register. Your
          details will be reviewed and verified before your membership is
          activated.
        </p>
      </div>

      <Card className="w-full max-w-2xl shadow-sm bg-white text-black border !border-[#2E7D32]/20">
        <CardContent className="py-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#1B5E20] font-semibold">
                        Student ID
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="25-1-12345"
                          className={lightInputClass}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#1B5E20] font-semibold">
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="you@vsu.edu.ph"
                          className={lightInputClass}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                      >
                        <FormControl>
                          <SelectTrigger className={lightSelectTriggerClass}>
                            <SelectValue placeholder="Select a program" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className={lightSelectContentClass}>
                          {PROGRAM_OPTIONS.map((program) => (
                            <SelectItem
                              key={program.value}
                              value={program.value}
                              className={lightSelectItemClass}
                            >
                              {program.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="yearLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#1B5E20] font-semibold">
                        Year Level
                      </FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(parseInt(value))
                        }
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger className={lightSelectTriggerClass}>
                            <SelectValue placeholder="Select year level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className={lightSelectContentClass}>
                          <SelectItem value="1" className={lightSelectItemClass}>
                            1st Year
                          </SelectItem>
                          <SelectItem value="2" className={lightSelectItemClass}>
                            2nd Year
                          </SelectItem>
                          <SelectItem value="3" className={lightSelectItemClass}>
                            3rd Year
                          </SelectItem>
                          <SelectItem value="4" className={lightSelectItemClass}>
                            4th Year
                          </SelectItem>
                          <SelectItem value="5" className={lightSelectItemClass}>
                            5th Year
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Certificate of Registration upload — Coming Soon */}
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#1B5E20]">
                    Certificate of Registration (COR)
                  </span>
                  <Badge
                    variant="secondary"
                    className="bg-[#8BC34A]/15 text-[#1B5E20] gap-1"
                  >
                    <Lock className="h-3 w-3" />
                    Coming Soon
                  </Badge>
                </div>
                <div
                  aria-disabled
                  className="flex cursor-not-allowed select-none flex-col items-center gap-3 rounded-lg border-2 border-dashed border-[#2E7D32]/25 bg-[#8BC34A]/5 px-4 py-8 text-center opacity-70"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#8BC34A]/15 text-[#2E7D32]">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1B5E20]">
                      Upload your COR attachment
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      COR upload will be available soon · PDF, PNG, JPG
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-between">
                <Button
                  asChild
                  variant="outline"
                  type="button"
                  disabled={isSubmitting}
                >
                  <Link href="/">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                  </Link>
                </Button>
                <Button
                  type="submit"
                  variant="success"
                  disabled={isSubmitting}
                  className="sm:min-w-[160px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Registration"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
