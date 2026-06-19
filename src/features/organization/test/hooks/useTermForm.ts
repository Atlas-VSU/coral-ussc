import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TermFormData, termSchema } from "@/lib/validators";

export const useTermForm = () => {
  return useForm<TermFormData>({
    resolver: zodResolver(termSchema),
    defaultValues: {
        AY: "",
        semester: "",
    },
  });
};
