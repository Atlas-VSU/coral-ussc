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
import {TermFormData } from "@/lib/validators";
import { Term } from "@/constants/types";
import { useTermForm } from "../hooks/useTermForm";

interface TermFormProps {
  open: boolean;  
  onOpenChange: (open: boolean) => void;
  onSubmit: (term: Term) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function TermForm({
  open,
  onOpenChange,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: TermFormProps) {
  const form = useTermForm();

  useEffect(() => {
if (open) {
      form.reset({
          AY: "",
          semester:""
      });
    }
  }, [open,form]);

const handleFormSubmit = async (data: TermFormData) => {
    if (isSubmitting) return;
    const termToSubmit: Term = {
      ...data,
      isActive: true
    };

    onSubmit(termToSubmit);
  };
  

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-4xl w-[90vw] max-h-[80vh] overflow-y-auto py-8 border-none">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl text-[#1B5E20] font-bold uppercase">"Add New Term"</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-4 overflow-y-auto"
          >
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="AY"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#1B5E20] font-semibold">Academic Year</FormLabel>
                    <FormControl>
                      <Input {...field} className="!bg-white text-black placeholder:text-gray-600 border-[#2E7D32]/30" />
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
                    <FormLabel className="text-[#1B5E20] font-semibold">Semester (1st or 2nd)</FormLabel>
                    <FormControl>
                      <Input {...field} className="!bg-white text-black placeholder:text-gray-600 border-[#2E7D32]/30" />
                    </FormControl>
                    <FormMessage />
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
                loadingText={ "Adding..."}
              >
                {"Add Term"}
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
