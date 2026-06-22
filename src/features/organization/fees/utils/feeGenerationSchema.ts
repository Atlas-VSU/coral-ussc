import z from "zod";

export const TITLE_MAX = 50;
export const DESCRIPTION_MAX = 150;

export const FeeGenerationSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(TITLE_MAX, `Title must be at most ${TITLE_MAX} characters`),
  amount: z.number().positive("Amount must be positive"),
  feeType: z.string().min(1, "Fee type is required"),
  description: z
    .string()
    .max(DESCRIPTION_MAX, `Description must be at most ${DESCRIPTION_MAX} characters`)
    .optional(),
  dueDate: z
    .date({ error: "Due date is required" })
    .refine(
      (d) => {
        const tomorrow = new Date();
        tomorrow.setHours(0, 0, 0, 0);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return d >= tomorrow;
      },
      { message: "Due date must be in the future" }
    ),
  isRequiredForClearance: z.boolean(),
});