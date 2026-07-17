import { z } from "zod";

export const updateRecordSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  programId: z.string().min(1, "Program is required"),
  yearLevel: z.number().min(1).max(6, "Year level is out of range"),
});

export type UpdateRecordFormData = z.infer<typeof updateRecordSchema>;

export const YEAR_LEVELS = [1, 2, 3, 4, 5, 6] as const;

export const formatYearLevel = (n: number) =>
  n === 1 ? "1st Year"
  : n === 2 ? "2nd Year"
  : n === 3 ? "3rd Year"
  : n === 4 ? "4th Year"
  : n === 5 ? "5th Year"
  : "6th Year";

// Shared input/select classes — same as self-register form
export const lightInputClass =
  "!bg-white !text-black placeholder:!text-gray-500 !border-[#2E7D32]/30 focus-visible:!ring-green-100";
export const lightSelectTriggerClass =
  "w-full !bg-white !text-black !border-[#2E7D32]/30 hover:bg-green-50 focus-visible:!ring-green-100 truncate";
export const lightSelectContentClass = "bg-white text-black !border-[#2E7D32]/30";
export const lightSelectItemClass = "text-black focus:bg-[#8BC34A]/10 focus:text-black";
