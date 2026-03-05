import { z } from "zod";
import { fa } from "zod/v4/locales";

export const eventSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  date: z.date({ error: "Event date is required" }),
  majorEvent: z.boolean().optional(),
  fineTypeId: z.string().min(1, "Fine type is required"),
  timeInStart: z.string().optional(),
  timeInEnd: z.string().optional(),
  timeOutStart: z.string().optional(),
  timeOutEnd: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  note: z.string().optional(),
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
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  programId: z.string().min(1, "Program is required"),
  facultyId: z.string().optional(),
  role: z.enum(["admin", "user", "super-admin"]),
  yearLevel: z.number().min(1).max(5).optional().or(z.literal(0)),
});

export type MemberFormData = z.infer<typeof memberSchema>;


export const fineTypeSchema = z.object({
  name: z.string().min(1, "Fine type name is required"),
  description: z.string().min(1, "Fine type description is required"),
  defaultAmount: z.number().min(0, "Default amount must be a positive number"),
  requiresTimeIn: z.boolean(), 
  requiresTimeOut: z.boolean().optional(),
  majorEventsOnly: z.boolean(),
});

export type FineTypeFormData = z.infer<typeof fineTypeSchema>;


export const paymentSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  studentId: z
    .string()
    .min(1, "Student ID is required")
    .regex(
      /^\d{2}-\d-\d{5}$/,
      "Student ID must follow format XX-X-XXXXX (e.g., 21-1-12345)"
    ),
  amount: z.number().min(0.01, "Amount must be greater than zero"),
  senderNumber: z.string()
  .min(11, "Sender number is required")
  .max(13, "Sender number is too long")
  .regex(/^([+]?63|0)9\d{9}$/, "Sender number must be a valid phone number"),
  referenceNumber: z.string().optional(),
  imageUrl: z.string().optional(),
  rejectionReason: z.string().optional(),
  notes: z.string().optional(),
});

export type PaymentFormData = z.infer<typeof paymentSchema>; 
