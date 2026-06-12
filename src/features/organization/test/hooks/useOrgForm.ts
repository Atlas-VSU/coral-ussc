import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OrgFormData, orgSchema } from "@/lib/validators";

export const useOrgForm = () => {
  return useForm<OrgFormData>({
    resolver: zodResolver(orgSchema),
    defaultValues: {
        name: "",
        shortName: "",
        subscribed: false,
        facultyId: "",
        programId: "",
        // users: []
    },
  });
};
