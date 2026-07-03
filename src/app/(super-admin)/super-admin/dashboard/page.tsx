import type { Metadata } from "next";
import SuperAdminDashboardPage from "@/features/super-admin/components/SuperAdminDashboardPage";

export const metadata: Metadata = {
  title: "Dashboard — Super Admin | USSC Connect",
  description:
    "Platform-level overview of all subscribing organizations on USSC Connect (VERIS).",
};

export default function Page() {
  return <SuperAdminDashboardPage />;
}
