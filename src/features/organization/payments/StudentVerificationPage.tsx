"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmationModal } from "./components/ConfirmationModal";

// Validation schema
const verificationSchema = z.object({
  studentId: z
    .string()
    .min(1, "Student ID is required")
    .regex(
      /^\d{2}-\d-\d{5}$/,
      "Student ID must follow format XX-X-XXXXX (e.g., 21-1-12345)"
    ),
  program: z.string().min(1, "Please select your program"),
});

type VerificationFormData = z.infer<typeof verificationSchema>;

interface StudentData {
  name: string;
  studentId: string;
  program: string;
}

const PROGRAM_OPTIONS = [
  { value: "bscs", label: "Bachelor of Science in Computer Science" },
  { value: "bsit", label: "Bachelor of Science in Information Technology" },
  { value: "bsce", label: "Bachelor of Science in Civil Engineering" },
  { value: "bsee", label: "Bachelor of Science in Electrical Engineering" },
] as const;

// Program code to full name mapping
const PROGRAM_NAMES: Record<string, string> = {
  bscs: "Bachelor of Science in Computer Science",
  bsit: "Bachelor of Science in Information Technology",
  bsce: "Bachelor of Science in Civil Engineering",
  bsee: "Bachelor of Science in Electrical Engineering",
};

interface StudentVerificationPageProps {
  onVerified: (data: StudentData) => void;
}

export default function StudentVerificationPage({ onVerified }: StudentVerificationPageProps) {
  const [showModal, setShowModal] = useState(false);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      studentId: "",
      program: "",
    },
  });

  const programValue = watch("program");

  const verifyStudent = async (data: VerificationFormData): Promise<StudentData> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      name: "Juan Dela Cruz",
      studentId: data.studentId.trim(),
      program: PROGRAM_NAMES[data.program] || data.program,
    };
  };

  const onSubmit = async (data: VerificationFormData) => {
    setSubmitError(null);
    setIsVerifying(true);

    try {
      const verifiedStudent = await verifyStudent(data);
      setStudentData(verifiedStudent);
      setShowModal(true);
    } catch {
      setSubmitError("Unable to verify your student details right now. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConfirm = () => {
    if (studentData) {
      setShowModal(false);
      onVerified(studentData);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setStudentData(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-4">
          <CardTitle>Student Payment Portal</CardTitle>
          <CardDescription>Enter your student information to continue</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Student ID Input */}
            <div className="space-y-2">
              <Label htmlFor="studentId">
                Student ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="studentId"
                placeholder="21-1-12345"
                {...register("studentId")}
                className={errors.studentId ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {errors.studentId ? (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    !
                  </span>
                  {errors.studentId.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Format: XX-X-XXXXX</p>
              )}
            </div>

            {/* Program Selection */}
            <div className="space-y-2">
              <Label htmlFor="program">
                Program <span className="text-red-500">*</span>
              </Label>
              <Select
                value={programValue}
                onValueChange={(value) => {
                  setValue("program", value, { shouldValidate: true });
                  clearErrors("program");
                }}
              >
                <SelectTrigger className={`w-full ${errors.program ? "border-red-500" : ""}`}>
                  <SelectValue placeholder="Select your program" />
                </SelectTrigger>
                <SelectContent>
                  {PROGRAM_OPTIONS.map((program) => (
                    <SelectItem key={program.value} value={program.value}>
                      {program.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.program && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    !
                  </span>
                  {errors.program.message}
                </p>
              )}
            </div>

            {submitError && (
              <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
            )}

            {/* Submit Button */}
            <Button type="submit" className="w-full mb-6" disabled={isVerifying}>
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      {studentData && (
        <ConfirmationModal
          open={showModal}
          onClose={handleCancel}
          onConfirm={handleConfirm}
          studentData={studentData}
        />
      )}
    </div>
  );
}
