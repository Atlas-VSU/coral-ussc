"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { FeeGenerationSchema } from "../utils/FeeGenerationSchema";
import { generateFeesForAllStudents } from "@/firebase/fees";
import { getCurrentUserData } from "@/firebase";
import { Member } from "@/features/organization/members/types";

export type FeeGenerationFormData = z.infer<typeof FeeGenerationSchema>;

interface UseFeeGenerationProps {
  students: Member[];
  onSuccess?: () => void;
  onOpenChange: (open: boolean) => void;
}

export function useFeeGeneration({ students, onSuccess, onOpenChange }: UseFeeGenerationProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FeeGenerationFormData | null>(null);

  const form = useForm<FeeGenerationFormData>({
    resolver: zodResolver(FeeGenerationSchema),
    defaultValues: {
      title: "",
      amount: 0,
      feeType: "membership",
      academicYear: "",
      semester: "",
      description: "",
      dueDate: undefined,
      isRequiredForClearance: false,
    },
  });

  const onFormSubmit = (data: FeeGenerationFormData) => {
    setPendingFormData(data);
    setShowConfirmDialog(true);
  };

  const handleConfirmedGeneration = async () => {
    if (!pendingFormData) return;

    setShowConfirmDialog(false);
    setIsGenerating(true);
    try {
      const currentUser = await getCurrentUserData();
      if (!currentUser) throw new Error("User not authenticated.");

      await generateFeesForAllStudents(
        pendingFormData,
        students,
        currentUser.uid
      );

      toast.success(`Successfully generated fees for ${students.length} students!`);
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to generate fees:", error);
      toast.error(error instanceof Error ? error.message : "An error occurred while generating fees.");
    } finally {
      setIsGenerating(false);
      setPendingFormData(null);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmDialog(false);
    setPendingFormData(null);
  };

  const handleCancel = () => {
    if (!isGenerating) {
      onOpenChange(false);
    }
  };

  const confirmationDescription = pendingFormData
    ? `You are about to generate a fee "${pendingFormData.title}" of ₱${pendingFormData.amount} for all ${students.length} students. This action cannot be undone.`
    : "";

  const confirmationNotice = pendingFormData
    ? `Fee Type: ${pendingFormData.feeType} | Academic Year: ${pendingFormData.academicYear} | Semester: ${pendingFormData.semester} | Due: ${format(pendingFormData.dueDate, "PPP")} | Required for clearance: ${pendingFormData.isRequiredForClearance ? "Yes" : "No"}`
    : "";

  return {
    form,
    isGenerating,
    showConfirmDialog,
    setShowConfirmDialog,
    onFormSubmit,
    handleConfirmedGeneration,
    handleCancelConfirmation,
    handleCancel,
    confirmationDescription,
    confirmationNotice,
  };
}
