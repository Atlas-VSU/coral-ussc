import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MemberFormData, memberSchema } from "@/lib/validators";

export const useMemberForm = () => {
  return useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      studentId: "",
      email: "",
      firstName: "",
      lastName: "",
      programId: "",
      role: "user",
      yearLevel: undefined,
    },
  });
};
