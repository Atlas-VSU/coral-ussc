import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FineTypeFormData, fineTypeSchema } from "@/lib/validators";

export const useFineTypeForm = () => {
  return useForm<FineTypeFormData>({
    resolver: zodResolver(fineTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      defaultAmount: 0,
      requiresTimeIn: true, 
      requiresTimeOut: false,
      majorEventsOnly: false,
    },
  });
};
