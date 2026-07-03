import { fetchSuperAdminData } from "@/firebase/super-admin";
import { OrgsTable } from "@/features/super-admin/components/OrgsTable";
import { Building2 } from "lucide-react";

export default async function SuperAdminOrganizationsPage() {
  const { orgs, accounts } = await fetchSuperAdminData();

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="h-5 w-5 text-blue-600" />
          <h1 className="text-xl font-bold text-slate-800">Organizations</h1>
        </div>
        <p className="text-sm text-slate-500">
          All registered organizations across the platform. Click a row to view
          full details.
        </p>
      </div>

      {/* Table */}
      <OrgsTable orgs={orgs} accounts={accounts} />
    </div>
  );
}