import { fetchSuperAdminData } from "@/firebase/super-admin";
import { DashboardOverview } from "@/features/super-admin/components/DashboardOverview";
import { ShieldCheck } from "lucide-react";

export default async function SuperAdminDashboardPage() {
  const { stats } = await fetchSuperAdminData();

  return (
    <div className="space-y-8 animate-page-enter">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="h-5 w-5 text-blue-600" />
          <h1 className="text-xl font-bold text-slate-800">
            Platform Overview
          </h1>
        </div>
        <p className="text-sm text-slate-500">
          Read-only view of all subscribing organizations and their accounts on
          USSC Connect (VERIS).
        </p>
      </div>

      {/* Stats */}
      <DashboardOverview stats={stats} />
    </div>
  );
}
