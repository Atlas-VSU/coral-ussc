"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { LoadingButton } from "@/components/ui/loading-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { MemberFormData } from "@/lib/validators";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  MemberData,
  Member,
  Program,
  Faculty,
} from "@/features/organization/members/types";
import { useMemberForm } from "../hooks/userMemberForm";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { getCurrentUserData } from "@/firebase/users";

interface MemberFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (member: Member) => void;
  member: MemberData | null;
  facultyData: Faculty[];
  programData: Program[];
  isSubmitting?: boolean;
}

export function MemberForm({
  open,
  onOpenChange,
  onSubmit,
  member,
  facultyData,
  programData,
  isSubmitting = false,
}: MemberFormProps) {
  const form = useMemberForm();
  const [agreed, setAgreed] = useState(false);
  const lightInputClass =
    "!bg-white !text-black placeholder:!text-gray-600 !border-[#2E7D32]/30 !focus:border-[#1B5E20] focus-visible:!ring-green-100";
  const lightSelectTriggerClass =
    "!bg-white !text-black placeholder:!text-gray-600 !border-[#2E7D32]/30 hover:bg-green-50 !focus:border-[#1B5E20] focus-visible:!ring-green-100";
  const lightSelectContentClass = "bg-white text-black !border-[#2E7D32]/30";
  const lightSelectItemClass =
    "text-black focus:bg-[#8BC34A]/10 focus:text-black";

  useEffect(() => {
    if (open && member) {
      member.member.yearLevel =
        parseInt(member.member.yearLevel as unknown as string) ?? 0;
      form.reset({
        ...member.member,
        role: "user", // Set default role to user
      });
      setAgreed(true); // Pre-check agreement for edits
    } else if (open) {
      form.reset({
        firstName: "",
        lastName: "",
        programId: "",
        studentId: "",
        email: "",
        yearLevel: undefined,
        role: "user", // Default role is always user
      });
      setAgreed(false);
    }
  }, [open, member, form]);

  const handleFormSubmit = async (data: MemberFormData) => {
    if (!agreed || isSubmitting) return;
    const currentUser = (await getCurrentUserData()) as unknown as Member;
    data.facultyId = currentUser.facultyId;
    const memberToSubmit: Member = {
      ...data,
      role: "user", // Always set role to "user"
    };

    onSubmit(memberToSubmit);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[80vh] overflow-y-auto py-8 bg-white text-black border !border-[#2E7D32]/30 shadow-lg">
        <DialogHeader className="pb-2 border-b !border-[#2E7D32]/20">
          <DialogTitle className="text-[#1B5E20]">
            {member ? "Edit Member" : "Add Member"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-4"
          >
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#1B5E20] font-semibold">
                      Student ID
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#1B5E20] font-semibold">
                      Email
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={lightSelectTriggerClass}>
                          <SelectValue placeholder="Select a program" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className={lightSelectContentClass}>
                        {programData.map((program: Program) => (
                          <SelectItem
                            key={program.id}
                            value={program.id}
                            className={lightSelectItemClass}
                          >
                            {program.name}
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
                      Year Level{" "}
                      <span className="text-[#2E7D32]/60">(Optional)</span>
                    </FormLabel>
                    <Select
                      onValueChange={(value) => {
                        if (value === "0") {
                          field.onChange(0);
                        } else {
                          field.onChange(parseInt(value));
                        }
                      }}
                      value={field.value?.toString() || "0"}
                    >
                      <FormControl>
                        <SelectTrigger className={lightSelectTriggerClass}>
                          <SelectValue placeholder="Select year level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className={lightSelectContentClass}>
                        <SelectItem value="0" className={lightSelectItemClass}>
                          None
                        </SelectItem>
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
                        <SelectItem value="6" className={lightSelectItemClass}>
                          6th Year
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Terms agreement */}
            <div className="bg-[#8BC34A]/5 p-4 rounded-md border !border-[#2E7D32]/30">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={agreed}
                  onCheckedChange={(checked) => {
                    setAgreed(checked === true);
                  }}
                  className="mt-0.5 !bg-white !border-[#2E7D32]/40 data-[state=checked]:!bg-white data-[state=checked]:!text-[#1B5E20] data-[state=checked]:!border-[#1B5E20]"
                />
                <Label
                  htmlFor="terms"
                  className="text-xs text-[#2E7D32]/80 text-justify leading-relaxed"
                >
                  I confirm that I have obtained explicit permission from this
                  student to store their personal information for the purpose of
                  account creation and management. This data will be accessible
                  only to the individual user associated with this account;
                  administrators and website operators will not access or use
                  this information except as required by law or university
                  policy. I agree to comply with all applicable data protection
                  regulations and university policies, and not to misuse or
                  disclose this data.
                </Label>
              </div>
            </div>

            <DialogFooter>
              <LoadingButton
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </LoadingButton>
              <LoadingButton
                type="submit"
                variant="success"
                disabled={!agreed}
                isLoading={isSubmitting}
                loadingText={member ? "Saving..." : "Adding..."}
              >
                {member ? "Save Changes" : "Add Member"}
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
