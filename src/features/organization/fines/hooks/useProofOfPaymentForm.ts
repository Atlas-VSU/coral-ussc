import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PaymentFormData, paymentSchema } from "@/lib/validators";
import { PaymentMethods, PaymentType } from "@/constants/types";
import { ZodType } from "zod";


export const useProofOfPaymentForm = (values?: {
  resolver?: ZodType<PaymentFormData>;
  defaultValues?: {
    userName?: string;
    studentId?: string;
    amount?: number;
    paymentMethod?: "gcash" | "cash" | "bank_transfer";
    referenceNumber?: string;
    senderNumber?: string;
    imageUrl?: string;
    rejectionReason?: string;
    notes?: string;
  };
}) => {
  return useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
        userName: values?.defaultValues?.userName || "",
        studentId: values?.defaultValues?.studentId || "",
        amount: values?.defaultValues?.amount || 0,
        paymentMethod: values?.defaultValues?.paymentMethod as PaymentMethods || PaymentMethods.GCASH,
        referenceNumber: "",
        senderNumber: "",
        imageUrl: "",
        rejectionReason: "",
        notes: "",
    },
  });
};
