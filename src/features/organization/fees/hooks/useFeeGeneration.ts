"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { FeeGenerationSchema } from "../utils/feeGenerationSchema";
import { checkFeeTitleExist, generateFeesForAllStudentsInAnOrg } from "@/firebase/fees";
import { Member } from "@/features/organization/members/types";
import { useAuth } from "@/hooks/useAuth";
import { getCurrentUserData } from "@/firebase";

export type FeeGenerationFormData = z.infer<typeof FeeGenerationSchema>;

interface UseFeeGenerationProps {
  studentsCount: number;
  onSuccess?: () => void;
  onOpenChange: (open: boolean) => void;
}

export function useFeeGeneration({ studentsCount, onSuccess, onOpenChange }: UseFeeGenerationProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FeeGenerationFormData | null>(null);

  // Progress states
  const [importProgress, setImportProgress] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);

  const form = useForm<FeeGenerationFormData>({
    resolver: zodResolver(FeeGenerationSchema),
    defaultValues: {
      title: "",
      amount: 0,
      feeType: "semester-membership",
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
    setImportProgress(0);
    setCurrentBatch(0);
    setTotalBatches(0);

    try {
      const currentUser = await getCurrentUserData();
      if(!currentUser) {
        throw new Error("No user!")
      }
      if(await checkFeeTitleExist(pendingFormData.title, pendingFormData.academicYear, pendingFormData.semester)) {
        toast.error("Fee title already exists for that academic year and semester!");
        return;
      }
      await generateFeesForAllStudentsInAnOrg(
        pendingFormData,
        currentUser,
        (progress) => {
          setImportProgress((progress.processedCount / progress.totalCount) * 100);
          setCurrentBatch(progress.currentBatch);
          setTotalBatches(progress.totalBatches);
        }
      );

      toast.success(`Successfully generated fees for ${studentsCount} students!`);
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to generate fees:", error);
      toast.error(error instanceof Error ? error.message : "An error occurred while generating fees.");
    } finally {
      setIsGenerating(false);
      setPendingFormData(null);
      // Reset progress after a short delay or leave it for the UI to handle
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
    ? `You are about to generate a fee "${pendingFormData.title}" of ₱${pendingFormData.amount} for all ${studentsCount} students. This action cannot be undone.`
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
    // Progress states
    importProgress,
    currentBatch,
    totalBatches,
  };
}
