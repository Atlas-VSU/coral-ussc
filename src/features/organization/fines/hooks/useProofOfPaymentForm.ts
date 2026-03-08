import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PaymentFormData, paymentSchema } from "@/lib/validators";
import { PaymentMethods, PaymentType } from "@/constants/types";


export const useProofOfPaymentForm = (values?: {
  defaultValues?: {
    userName?: string;
    studentId?: string;
    amount?: number;
    paymentMethod?: string;
  };
}) => {
  return useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
        userName: values?.defaultValues?.userName || "",
        studentId: values?.defaultValues?.studentId || "",
        amount: values?.defaultValues?.amount || 0,
        paymentMethod: values?.defaultValues?.paymentMethod || PaymentMethods.GCASH,
        referenceNumber: "",
        senderNumber: "",
        imageUrl: "",
        rejectionReason: "",
        notes: "",
    },
  });
};
