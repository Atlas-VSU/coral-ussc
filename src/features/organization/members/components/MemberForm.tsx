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
import { getCurrentUserFacultyId } from "@/firebase/users";
import { getAuth } from "firebase/auth";

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
    data.facultyId = (await getCurrentUserFacultyId(
      getAuth().currentUser?.uid || ""
    )) as string;
    console.log("Form Data Submitted:", data);
    const memberToSubmit: Member = {
      ...data,
      role: "user", // Always set role to "user"
    };

    onSubmit(memberToSubmit);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[80vh] overflow-y-auto py-8">
        <DialogHeader className="pb-2">
          <DialogTitle>{member ? "Edit Member" : "Add Member"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-4 overflow-y-auto"
          >
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student ID</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Program</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a program" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {programData.map((program: Program) => (
                          <SelectItem key={program.id} value={program.id}>
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
                    <FormLabel>Year Level (Optional)</FormLabel>
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
                        <SelectTrigger>
                          <SelectValue placeholder="Select year level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">None</SelectItem>
                        <SelectItem value="1">1st Year</SelectItem>
                        <SelectItem value="2">2nd Year</SelectItem>
                        <SelectItem value="3">3rd Year</SelectItem>
                        <SelectItem value="4">4th Year</SelectItem>
                        <SelectItem value="5">5th Year</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Terms agreement */}
            <div className="bg-muted/50 p-4 rounded-md border">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={agreed}
                  onCheckedChange={(checked) => {
                    setAgreed(checked === true);
                  }}
                  className="mt-0.5"
                />
                <Label
                  htmlFor="terms"
                  className="text-xs text-justify leading-relaxed"
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
              <Button type="submit" disabled={!agreed || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    {member ? "Saving..." : "Adding..."}
                  </>
                ) : (
                  member ? "Save Changes" : "Add Member"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
