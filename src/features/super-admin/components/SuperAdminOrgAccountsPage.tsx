import { fetchSuperAdminData } from "@/firebase/super-admin";
import { OrgAccountsTable } from "@/features/super-admin/components/OrgAccountsTable";
import { Users } from "lucide-react";

export default async function SuperAdminOrgAccountsPage() {
  const { accounts, orgs } = await fetchSuperAdminData();

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Users className="h-5 w-5 text-blue-600" />
          <h1 className="text-xl font-bold text-slate-800">Org Accounts</h1>
        </div>
        <p className="text-sm text-slate-500">
          All organization admin accounts linked to subscribing organizations.
          Click a row to view full details.
        </p>
      </div>

      {/* Table */}
      <OrgAccountsTable accounts={accounts} orgs={orgs} />
    </div>
  );
}
