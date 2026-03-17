"use client";

import { format } from "date-fns";
import { AlertTriangle, Clock } from "lucide-react";

import "./styles/feeDialog.css";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { cn } from "@/lib/utils";

// import { ConfirmDialog } from "./ConfirmDialog";
import { ConfirmDialog } from "@/features/organization/fees/components/ConfirmDialog";
// import { useFeeGeneration } from "../hooks/useFeeGeneration";
import { useFeeGeneration } from "@/features/organization/fees/hooks/useFeeGeneration";
import { Member } from "@/features/organization/members/types";

interface FeeGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentsCount: number;
  onClose?: () => void; 
}

export function FeeGenerationDialog({
  open,
  onOpenChange,
  studentsCount,
  onClose,
}: FeeGenerationDialogProps) {
  const {
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
    importProgress,
    currentBatch,
    totalBatches,
  } = useFeeGeneration({
    studentsCount,
    onOpenChange,
    onSuccess: onClose,
  });

  return (
    <>
      <Dialog open={open} onOpenChange={isGenerating ? undefined : onOpenChange}>
        <DialogContent className="sm:max-w-[500px] h-auto pt-8 pb-4 overflow-y-auto" showCloseButton={!isGenerating}>
          <DialogHeader>
            <DialogTitle>Generate Fees for All Students</DialogTitle>
            <DialogDescription>
              {isGenerating 
                ? "Processing fee generation in batches. Please wait..."
                : "Create a new fee entry that will be applied to all students. Fill in the details below."}
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            {isGenerating ? (
              <div className="space-y-6 py-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium flex items-center gap-2 text-[#1B5E20]">
                       <Clock className="h-4 w-4 animate-pulse" />
                       Generating Fees...
                    </span>
                    <span className="text-[#2E7D32]/70">
                      {importProgress.toFixed(0)}% complete
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div
                      className="h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${importProgress}%`, backgroundColor: '#1B5E20' }}
                    ></div>
                  </div>

                  {/* Batch info */}
                  {currentBatch > 0 && totalBatches > 0 && (
                    <div className="flex justify-between text-xs text-[#2E7D32]/60">
                      <span>
                        Batch {currentBatch} of {totalBatches}
                      </span>
                      <span>Processing {studentsCount.toLocaleString()} students</span>
                    </div>
                  )}
                </div>
                
                <div className="p-4 bg-[#8BC34A]/10 rounded-lg border border-[#2E7D32]/30 text-sm text-[#1B5E20] italic">
                  Please do not close this window or refresh the page while generation is in progress.
                </div>
              </div>
            ) : (
              <Form {...form}>
              <form onSubmit={form.handleSubmit(onFormSubmit)} className="grid gap-4 py-4">
                {/* Fee Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#1B5E20] font-semibold">Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Membership Fee 2024"
                          {...field}
                          disabled={isGenerating}
                          className="!bg-white border-[#2E7D32]/30 focus:border-[#1B5E20]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#1B5E20] font-semibold">
                        Description <span className="text-[#2E7D32]/60">(Optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Brief description of this fee"
                          {...field}
                          disabled={isGenerating}
                          className="!bg-white border-[#2E7D32]/30 focus:border-[#1B5E20]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Fee Type */}
                <FormField
                  control={form.control}
                  name="feeType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#1B5E20] font-semibold">Type of Fee</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isGenerating}
                      >
                        <FormControl>
                          <SelectTrigger className="!bg-white border-[#2E7D32]/30">
                            <SelectValue placeholder="Select fee type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="semester-membership">Semestral Membership</SelectItem>
                          <SelectItem value="organization-dues">Organization Fee</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Amount */}
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#1B5E20] font-semibold">Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          disabled={isGenerating}
                          className="!bg-white border-[#2E7D32]/30 focus:border-[#1B5E20]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={handleCancel}
                    disabled={isGenerating}
                    className="bg-white border-[#2E7D32]/30 text-[#1B5E20] hover:bg-white hover:text-[#1B5E20]"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isGenerating}
                    style={{
                      backgroundColor: '#1B5E20',
                      color: 'white',
                    }}
                    className="hover:bg-[#0d4017]"
                  >
                    Generate Fees
                  </Button>
                </DialogFooter>
                </form>
              </Form>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleConfirmedGeneration}
        onCancel={handleCancelConfirmation}
        title="Confirm Fee Generation"
        description={confirmationDescription}
        confirmText="Yes, Generate Fees"
        cancelText="No, Go Back"
        variant="warning"
        icon={<AlertTriangle className="h-6 w-6" />}
        notice={confirmationNotice}
      />
    </>
  );
}