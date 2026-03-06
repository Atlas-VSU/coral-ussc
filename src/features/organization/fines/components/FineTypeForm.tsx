"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { getCurrentUserData } from "@/firebase/users";

interface FineTypeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (fineType: FineType) => void;
  fineType: FineType | null;
  isSubmitting?: boolean;
}

export function FineTypeForm({
  open,
  onOpenChange,
  onSubmit,
  fineType,
  isSubmitting = false,
}: FineTypeFormProps) {
  const form = useFineTypeForm();

  useEffect(() => {
    if (open && fineType) {
      // for updating logic
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
  }, [open, fineType, form]);

  const handleFormSubmit = async (data: FineTypeFormData) => {
    if (isSubmitting) return;
    console.log("Form Data Submitted:", data);
    const fineTypeToSubmit: FineType = {
      ...data,
      isActive: true,
    };

    onSubmit(fineTypeToSubmit);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[80vh] overflow-y-auto py-8">
        <DialogHeader className="pb-2">
          <DialogTitle>{fineType ? "Edit FineType" : "Add FineType"}</DialogTitle>
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
                    <FormLabel>Name of Fine</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Amount per Sign</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.valueAsNumber)} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="requiresTimeIn"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Time-in Required</FormLabel>
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
                name="requiresTimeOut"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Time-out Required</FormLabel>
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
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>For major events only</FormLabel>
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    {fineType ? "Saving..." : "Adding..."}
                  </>
                ) : (
                  fineType ? "Save Changes" : "Add FineType"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
