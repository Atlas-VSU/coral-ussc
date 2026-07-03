import type { Metadata } from "next";
import SuperAdminOrganizationsPage from "@/features/super-admin/components/SuperAdminOrganizationsPage";

export const metadata: Metadata = {
  title: "Organizations — Super Admin | USSC Connect",
  description:
    "Read-only view of all registered organizations on USSC Connect (VERIS).",
};

export default function Page() {
  return <SuperAdminOrganizationsPage />;
}
