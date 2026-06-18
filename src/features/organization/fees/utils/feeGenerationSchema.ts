import z from "zod";

export const FeeGenerationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  amount: z.number().positive("Amount must be positive"),
  feeType: z.string().min(1, "Fee type is required"),
  description: z.string().optional(),
  dueDate: z.date(),
  isRequiredForClearance: z.boolean(),
});