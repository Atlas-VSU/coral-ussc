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
import {OrgFormData } from "@/lib/validators";
import { Organization } from "@/constants/types";
import { useOrgForm } from "../hooks/useOrgForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Faculty, Program } from "@/features/organization/members/types";

interface OrgFormProps {
  open: boolean;  
  programs: Program[];
  faculties: Faculty[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (org: Organization) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function OrgForm({
  open,
  programs,
  faculties,
  onOpenChange,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: OrgFormProps) {
  const form = useOrgForm();

  useEffect(() => {
if (open) {
      form.reset({
        name: "",
        shortName: "",
        subscribed: false,
        // users: []
      });
    }
  }, [open,form]);

const handleFormSubmit = async (data: OrgFormData) => {
    if (isSubmitting) return;
    const orgToSubmit: Organization = {
      ...data,
      isArchived: false,
    };

    onSubmit(orgToSubmit);
  };
  
const parseCSVTo1DArray = (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
        const text = e.target?.result as string;
        if (!text) return resolve([]);
        
        // Split by lines, trim whitespace, and filter out completely empty lines
        const arrayData = text
            .split(/\r?\n/)
            .map((row) => row.trim())
            .filter((row) => row !== "");
            
        resolve(arrayData); // Returns a clean flat array: ["item1", "item2", "item3"]
        };
        reader.onerror = (err) => reject(err);
        reader.readAsText(file);
    });
    };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-4xl w-[90vw] max-h-[80vh] overflow-y-auto py-8 border-none">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl text-[#1B5E20] font-bold uppercase">"Add Organization"</DialogTitle>
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
                    <FormLabel className="text-[#1B5E20] font-semibold">Name of the Organization</FormLabel>
                    <FormControl>
                      <Input {...field} className="!bg-white text-black placeholder:text-gray-600 border-[#2E7D32]/30" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shortName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#1B5E20] font-semibold">Short Name</FormLabel>
                    <FormControl>
                      <Input {...field} className="!bg-white text-black placeholder:text-gray-600 border-[#2E7D32]/30" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

               <FormField
                control={form.control}
                name="subscribed"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-[#2E7D32]/30 p-4 bg-[#8BC34A]/5">
                    <div className="space-y-0.5">
                      <FormLabel className="text-[#1B5E20] font-semibold">Already subscribed?</FormLabel>
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
                name="facultyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Faculty (Optional)</FormLabel>
                    <Select 
                      onValueChange={(val) => field.onChange(val === "none" ? undefined : val)} 
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an associated faculty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">All Faculties</SelectItem>
                        {faculties.map((f: Faculty) => (
                          <SelectItem key={f.id} value={f.id!}>
                            {f.name}
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
                name="programId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program (Optional)</FormLabel>
                    <Select 
                      onValueChange={(val) => field.onChange(val === "none" ? undefined : val)} 
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an associated course program" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">All Programs</SelectItem>
                        {programs.map((p: Program) => (
                          <SelectItem key={p.id} value={p.id!}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
            {/* <FormField
                control={form.control}
                name="users"
                render={({ field }) => (
                    <FormItem className="flex flex-col space-y-2 rounded-lg border border-[#2E7D32]/30 p-4 bg-[#8BC34A]/5">
                    <div className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                        <FormLabel className="text-[#1B5E20] font-semibold">
                            Upload CSV Data <span className="text-xs font-normal text-gray-400">(Optional)</span>
                        </FormLabel>
                        <div className="text-xs text-emerald-800/70">
                            {field.value && field.value.length > 0
                            ? `Loaded ${field.value.length} items successfully`
                            : "Convert a single-column .csv file into a flat list"}
                        </div>
                        </div>

                        <FormControl>
                        <div className="flex items-center">
                            <input
                            type="file"
                            id="csv-file-upload"
                            accept=".csv"
                            className="hidden"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) {
                                field.onChange(undefined);
                                return;
                                }
                                try {
                                const parsedData = await parseCSVTo1DArray(file);
                                field.onChange(parsedData); // Injects string[] directly into React Hook Form
                                } catch (error) {
                                form.setError("users", {
                                    type: "manual",
                                    message: "Failed parsing CSV into a flat list.",
                                });
                                }
                            }}
                            />
                            
                            <label
                            htmlFor="csv-file-upload"
                            className="cursor-pointer rounded-md bg-[#2E7D32] hover:bg-[#1B5E20] px-4 py-2 text-xs font-medium text-white shadow-sm transition-all"
                            >
                            {field.value && field.value.length > 0 ? "Replace File" : "Choose File"}
                            </label>
                        </div>
                        </FormControl>
                    </div>
                    
                    <FormMessage />
                    </FormItem>
                )}
            /> */}

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
                {"Add Organization"}
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
