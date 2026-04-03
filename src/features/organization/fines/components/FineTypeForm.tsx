"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch"; 
import { FineType } from "../types";
import { useFineTypeForm } from "../hooks/useFineTypeForm";
import { FineTypeFormData } from "@/lib/validators";

interface FineTypeFormProps {
  initialData?: FineType;
  open: boolean;  
  onOpenChange: (open: boolean) => void;
  onSubmit: (fineType: FineType) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  fetchFineTypes: () => Promise<void>;
}

export function FineTypeForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  onCancel,
  isSubmitting = false,
  fetchFineTypes,
}: FineTypeFormProps) {
  const form = useFineTypeForm();

  useEffect(() => {
    if (open && initialData) {
      form.reset({
        name: initialData.name,
        description: initialData.description,
        defaultAmount: initialData.defaultAmount,
        requiresTimeIn: initialData.requiresTimeIn,
        requiresTimeOut: initialData.requiresTimeOut,
        majorEventsOnly: initialData.majorEventsOnly,
      });
    } else if (open) {
      form.reset({
        name: "",
        description: "",
        defaultAmount: 0,
        requiresTimeIn: true, 
        requiresTimeOut: false,
        majorEventsOnly: false,
      });
    }
  }, [open, initialData, form]);

  const handleFormSubmit = async (data: FineTypeFormData) => {
    if (isSubmitting) return;
    const fineTypeToSubmit: FineType = {
      ...data,
      isActive: true,
    };

    onSubmit(fineTypeToSubmit);
    fetchFineTypes();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-4xl w-[90vw] max-h-[80vh] overflow-y-auto py-8 border-none">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl text-[#1B5E20] font-bold uppercase">{initialData ? "Edit a Type of Fine" : "Add a Type of Fines"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-4 overflow-y-auto"
          >
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#1B5E20] font-semibold">Name of Fine</FormLabel>
                    <FormControl>
                      <Input {...field} className="!bg-white text-black placeholder:text-gray-600 border-[#2E7D32]/30" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#1B5E20] font-semibold">Description</FormLabel>
                    <FormControl>
                      <Input {...field} className="!bg-white text-black placeholder:text-gray-600 border-[#2E7D32]/30" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="defaultAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#1B5E20] font-semibold">Amount per Sign</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        className="!bg-white text-black placeholder:text-gray-600 border-[#2E7D32]/30"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

               <FormField
                control={form.control}
                name="requiresTimeOut"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-[#2E7D32]/30 p-4 bg-[#8BC34A]/5">
                    <div className="space-y-0.5">
                      <FormLabel className="text-[#1B5E20] font-semibold">Time-out Required</FormLabel>
                      <FormMessage />
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="majorEventsOnly"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-[#2E7D32]/30 p-4 bg-[#8BC34A]/5">
                    <div className="space-y-0.5">
                      <FormLabel className="text-[#1B5E20] font-semibold">For major events only</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <LoadingButton variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </LoadingButton>
              <LoadingButton 
                variant="success"
                type="submit" 
                isLoading={isSubmitting}
                loadingText={initialData ? "Saving..." : "Adding..."}
              >
                {initialData ? "Save Changes" : "Add Fine Type"}
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
