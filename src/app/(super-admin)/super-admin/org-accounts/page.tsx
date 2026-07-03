import type { Metadata } from "next";
import SuperAdminOrgAccountsPage from "@/features/super-admin/components/SuperAdminOrgAccountsPage";

export const metadata: Metadata = {
  title: "Org Accounts — Super Admin | USSC Connect",
  description:
    "Read-only view of all organization admin accounts on USSC Connect (VERIS).",
};

export default function Page() {
  return <SuperAdminOrgAccountsPage />;
}
