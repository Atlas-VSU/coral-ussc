import z from "zod";

export const FeeGenerationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  amount: z.number().positive("Amount must be positive"),
  feeType: z.string().min(1, "Fee type is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  semester: z.string().min(1, "Semester is required"),
  description: z.string().optional(),
  dueDate: z.date(),
  isRequiredForClearance: z.boolean(),
});