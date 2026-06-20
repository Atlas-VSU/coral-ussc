import { PaymentMethods } from "@/constants/types";
import { z } from "zod";
import { fa } from "zod/v4/locales";

export const eventSchema = z.object({
  name: z
    .string()
    .min(1, "Event name is required")
    .max(50, "Event name must be at most 50 characters"),
  date: z
    .date({ error: "Event date is required" })
    .refine(
      (d) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return d >= today;
      },
      { message: "Event date must be today or in the future" }
    ),
  majorEvent: z.boolean().optional(),
  fineTypeId: z.string().min(1, "Fine type is required"),
  timeInStart: z.string().optional(),
  timeInEnd: z.string().optional(),
  timeOutStart: z.string().optional(),
  timeOutEnd: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  note: z
    .string()
    .max(100, "Note must be at most 100 characters")
    .optional(),
});

export type EventFormData = z.infer<typeof eventSchema>;

export const memberSchema = z.object({
  studentId: z
    .string()
    .min(1, "Student ID is required")
    .regex(
      /^\d{2}-\d-\d{5}$/,
      "Student ID must follow format XX-X-XXXXX (e.g., 21-1-12345)"
    ),
  email: z.string().min(5, "Email is required").email("Invalid email"),
  firstName: z
    .string()
    .min(2, "First name is required")
    .max(50, "First name must be at most 50 characters"),
  lastName: z
    .string()
    .min(2, "Last name is required")
    .max(50, "Last name must be at most 50 characters"),
  programId: z.string().min(1, "Program is required"),
  facultyId: z.string().optional(),
  role: z.enum(["admin", "user", "super-admin"]),
  yearLevel: z.number().min(1).max(6).optional().or(z.literal(0)),
});

export type MemberFormData = z.infer<typeof memberSchema>;


export const fineTypeSchema = z.object({
  name: z.string().min(1, "Fine type name is required").max(50, "Fine type name must be at most 50 characters"),
  description: z.string().min(1, "Fine type description is required").max(150, "Description must be at most 150 characters"),
  defaultAmount: z.number().min(1, "Amount must be greater than 0.").max(10000, "Amount must be less than 10,000."),
  requiresTimeIn: z.boolean(),
  requiresTimeOut: z.boolean().optional(),
  majorEventsOnly: z.boolean(),
}).refine(
  // at least one of these must be true
  (data) => data.requiresTimeIn || data.requiresTimeOut,
  {
    message: "At least one of Time-in or Time-out must be enabled",
    path: ["requiresTimeIn"], // which field the error appears under
  }
);

export type FineTypeFormData = z.infer<typeof fineTypeSchema>;

export const paymentSchema = z.object({
  userName: z.string().min(2, "Name is required"),
  studentId: z
    .string()
    .min(1, "Student ID is required")
    .regex(
      /^\d{2}-\d-\d{5}$/,
      "Student ID must follow format XX-X-XXXXX (e.g., 21-1-12345)"
    ),
  amount: z.number().min(0.01, "Amount must be greater than zero"),
  paymentMethod: z.enum(PaymentMethods),
  referenceNumber: z.string().optional(),
  senderNumber: z.string().optional(),
  imageUrl: z.string().optional(),
  rejectionReason: z.string().optional(),
  notes: z.string().optional(),
  type: z.string().optional(),
  paymentHistoryId: z.string().optional(),
  referenceId: z.string().optional(),
})
  .superRefine((values, ctx) => {
    if (values.paymentMethod === "gcash") {
      const phoneRegex = /^([+]?63|0)9\d{9}$/;

      if (!values.senderNumber || !phoneRegex.test(values.senderNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "A valid phone number is required for GCash payments",
          path: ["senderNumber"],
        });
      }
    }

    if ((values.paymentMethod === "bank_transfer" || values.paymentMethod === "gcash") && (!values.referenceNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Reference number is required",
        path: ["referenceNumber"],
      });
    }
  });

export type PaymentFormData = z.infer<typeof paymentSchema>; 


export const orgSchema = z.object({
  name: z.string().min(1, "Name is required"),
  shortName: z.string().min(1, "Short name is required"),
  subscribed: z.boolean(),
  facultyId: z.string().optional().or(z.literal("")),
  programId: z.string().optional().or(z.literal("")),
  accessLevel: z.number().default(1).optional()
  // users: z.string().array().optional()
});

export type OrgFormData = z.infer<typeof orgSchema>;

export const termSchema = z.object({
  AY: z.string().min(9, "Academic Year is required")
    .regex(
      /^\d{4}-\d{4}$/,
      "Academic Year must follow format XXXX-XXXX (e.g., 2025-2026)"
    ),
  semester: z.string().min(3, "Semester is required")
    .regex(
      /^(1st|2nd)$/,
      "Semester must either be 1st or 2nd"
    ),
});

export type TermFormData = z.infer<typeof termSchema>;