import { z } from "zod";

// Types 
export interface ProgramOption {
  value: string;
  label: string;
}

// Schema 
export const selfRegisterSchema = z.object({
  studentId: z
    .string()
    .min(1, "Student ID is required")
    .regex(
      /^\d{2}-\d-\d{5}$/,
      "Student ID must follow format XX-X-XXXXX (e.g., 25-1-12345)"
    ),
  email: z.string().min(5, "Email is required").email("Invalid email"),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  programId: z.string().min(1, "Program is required"),
});

export type SelfRegisterFormData = z.infer<typeof selfRegisterSchema>;

// Self-registration is exclusively for incoming freshmen, so the year level is
// fixed rather than chosen.
export const FRESHMAN_YEAR_LEVEL = 1;

// Shared light/green field styling 
// Keeps the self-register form consistent with the Add Member form.
export const lightInputClass =
  "!bg-white !text-black placeholder:!text-gray-500 !border-[#2E7D32]/30 focus-visible:!ring-green-100 ";
export const lightSelectTriggerClass =
  "w-full !bg-white !text-black !border-[#2E7D32]/30 hover:bg-green-50 focus-visible:!ring-green-100 truncate";
export const lightSelectContentClass = "bg-white text-black !border-[#2E7D32]/30";
export const lightSelectItemClass = "text-black focus:bg-[#8BC34A]/10 focus:text-black ";
