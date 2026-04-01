"use client";

import { format } from "date-fns";
import { AlertTriangle, CalendarIcon, Clock } from "lucide-react";

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
} from "@/components/ui/dialog";
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

import { useFeeGeneration } from "../hooks/useFeeGeneration";
import { Member } from "@/features/organization/members/types";
import { FeeGenerationProgress } from "./FeeGenerationProgress";
import { ConfirmationDialog } from "./ConfirmationDialog";

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
    totalCount,
  } = useFeeGeneration({
    studentsCount,
    onOpenChange,
    onSuccess: onClose,
  });

  return (
    <>
      <Dialog open={open} onOpenChange={isGenerating ? undefined : onOpenChange}>
        <DialogContent className={cn("sm:max-w-[500px] h-auto pt-8 pb-4 overflow-y-auto", "min-h-[420px]", isGenerating && "max-h-[600px]")} showCloseButton={!isGenerating}>
          <DialogHeader>
            <DialogTitle>{isGenerating ? "Fee Generation in Progress" : "Create New Fee"}</DialogTitle>
            <DialogDescription>
              {isGenerating 
                ? "Processing fee generation in batches. Please wait..."
                : "Create a new fee entry that will be applied to all students. Fill in the details below."}
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            {isGenerating ? (
             <FeeGenerationProgress
                processedCount={importProgress}  
                totalCount={totalCount}
                currentBatch={currentBatch}
                totalBatches={totalBatches}
              />
            ) : (
              <Form {...form}>
              <form onSubmit={form.handleSubmit(onFormSubmit)} className="grid gap-4 py-4">
                {/* Fee Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fee Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Membership Fee 2024"
                          {...field}
                          disabled={isGenerating}
                        />
                      </FormControl>
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
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          disabled={isGenerating}
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
                      <FormLabel>Fee Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isGenerating}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select fee type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="semester-membership">Membership</SelectItem>
                          <SelectItem value="event-fee">Event</SelectItem>
                          <SelectItem value="charity-fee">Charity</SelectItem>
                          <SelectItem value="organization-dues">Organization Dues</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Academic Year */}
                <FormField
                  control={form.control}
                  name="academicYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academic Year</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 2024-2025"
                          {...field}
                          disabled={isGenerating}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="semester"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Semester</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isGenerating}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select semester" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1st">1st Semester</SelectItem>
                          <SelectItem value="2nd">2nd Semester</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Due Date */}
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild disabled={isGenerating}>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground",
                                isGenerating && "opacity-50 cursor-not-allowed"
                              )}
                              disabled={isGenerating}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a due date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={isGenerating}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Optional description"
                          {...field}
                          disabled={isGenerating}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Required for Clearance */}
                <FormField
                  control={form.control}
                  name="isRequiredForClearance"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isGenerating}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Required for clearance</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          If checked, students must pay this fee to be cleared.
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={handleCancel}
                    disabled={isGenerating}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isGenerating}>
                    Generate Fees
                  </Button>
                </DialogFooter>
                </form>
              </Form>
            )}
          </div>
        </DialogContent>
      </Dialog>


      <ConfirmationDialog
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