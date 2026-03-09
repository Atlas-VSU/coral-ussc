"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PaymentFormData, paymentSchema } from "@/lib/validators";
import { PaymentMethods } from "@/constants/types";
import { OnlinePaymentMethod } from "../types";

export interface ImageData {
  file: File;
  preview: string;
}

export type FormStatus = "idle" | "submitting" | "success";

export function usePaymentForm() {
  const [image, setImage] = useState<ImageData | null>(null);
  const [status, setStatus] = useState<FormStatus>("idle");

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      userName: "",
      studentId: "",
      amount: 0,
      paymentMethod: PaymentMethods.GCASH,
      referenceNumber: "",
      senderNumber: "",
      notes: "",
      rejectionReason: "",
      imageUrl: "",
    },
  });

  const paymentMethod = form.watch("paymentMethod");
  const needsRef = ["gcash", "bank_transfer"].includes(paymentMethod ?? "");
  const isGcash  = paymentMethod === "gcash";


  const handleMethodSelect = (value: OnlinePaymentMethod) => {
    form.setValue("paymentMethod", value, { shouldValidate: true });
    form.setValue("referenceNumber", "");
    form.setValue("senderNumber", "");
    form.clearErrors(["referenceNumber", "senderNumber"]);
  };

  const onSubmit = async (data: PaymentFormData) => {
    setStatus("submitting");
    try {
      // ── TODO: Upload image to Firebase/Supabase storage ──────────────
      // Firebase:
      //   const storageRef = ref(storage, `payment-receipts/${Date.now()}-${image?.file.name}`);
      //   await uploadBytes(storageRef, image!.file);
      //   const imageUrl = await getDownloadURL(storageRef);
      //   data.imageUrl = imageUrl;
      //
      // Supabase:
      //   const { data: uploaded } = await supabase.storage.from('receipts').upload(`${Date.now()}`, image!.file);
      //   data.imageUrl = supabase.storage.from('receipts').getPublicUrl(uploaded!.path).data.publicUrl;
      // ─────────────────────────────────────────────────────────────────

      console.log("Submitting:", data);
      await new Promise(r => setTimeout(r, 1800)); // remove when wiring real upload
      setStatus("success");
    } catch (error) {
      console.error("Submission failed:", error);
      setStatus("idle");
    }
  };

  const handleReset = () => {
    form.reset();
    setImage(null);
    setStatus("idle");
  };

  return {
    form,
    image,
    setImage,
    status,
    needsRef,
    isGcash,
    handleMethodSelect,
    handleReset,
    onSubmit: form.handleSubmit(onSubmit),
  };
}
