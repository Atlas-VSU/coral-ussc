"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "./StatusBadge";
import { OrgAccountDetailSheet } from "./OrgAccountDetailSheet";
import { TableSkeleton } from "./TableSkeleton";
import type {
  SuperAdminOrgAccount,
  SuperAdminOrg,
} from "@/features/super-admin/types";
import { Users, Search, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";

interface OrgAccountsTableProps {
  accounts: SuperAdminOrgAccount[];
  orgs: SuperAdminOrg[];
  isLoading?: boolean;
}

export function OrgAccountsTable({
  accounts,
  orgs,
  isLoading = false,
}: OrgAccountsTableProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [deletedFilter, setDeletedFilter] = useState<"all" | "not_deleted" | "deleted">("all");
  const [search, setSearch] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<SuperAdminOrgAccount | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const orgMap = useMemo(
    () => new Map(orgs.map((o) => [o.id, o])),
    [orgs]
  );

  const filtered = useMemo(() => {
    return accounts.filter((acc) => {
      if (activeFilter === "active" && !acc.is_active) return false;
      if (activeFilter === "inactive" && acc.is_active) return false;
      if (deletedFilter === "not_deleted" && acc.is_deleted) return false;
      if (deletedFilter === "deleted" && !acc.is_deleted) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          acc.full_name.toLowerCase().includes(q) ||
          acc.email.toLowerCase().includes(q) ||
          (acc.org_name?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [accounts, activeFilter, deletedFilter, search]);

  const linkedOrg = selectedAccount
    ? orgMap.get(selectedAccount.org_id) ?? null
    : null;

  const handleRowClick = (account: SuperAdminOrgAccount) => {
    setSelectedAccount(account);
    setSheetOpen(true);
  };

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search accounts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm border-blue-100 focus-visible:ring-blue-300"
          />
        </div>

        <Select
          value={activeFilter}
          onValueChange={(v) =>
            setActiveFilter(v as typeof activeFilter)
          }
        >
          <SelectTrigger className="w-[160px] h-9 text-sm border-blue-100">
            <SelectValue placeholder="All Accounts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Accounts</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="inactive">Inactive Only</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={deletedFilter}
          onValueChange={(v) =>
            setDeletedFilter(v as typeof deletedFilter)
          }
        >
          <SelectTrigger className="w-[160px] h-9 text-sm border-blue-100">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="not_deleted">Not Deleted</SelectItem>
            <SelectItem value="deleted">Deleted Only</SelectItem>
          </SelectContent>
        </Select>

        <span className="text-xs text-slate-400 ml-auto whitespace-nowrap">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-blue-50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-blue-50">
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-3">
                Full Name
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 hidden sm:table-cell">
                Email
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 hidden md:table-cell">
                Organization
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-3">
                Active
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 hidden sm:table-cell">
                Deleted
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 hidden lg:table-cell">
                Created At
              </TableHead>
            </TableRow>
          </TableHeader>

          {isLoading ? (
            <TableSkeleton rows={6} cols={6} />
          ) : filtered.length === 0 ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="h-10 w-10 text-slate-200 mb-3" />
                    <p className="text-sm font-medium text-slate-500">
                      No accounts found
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try adjusting your filters
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody>
              {filtered.map((account) => (
                <TableRow
                  key={account.id}
                  className="cursor-pointer hover:bg-blue-50/50 transition-colors border-b border-slate-50 last:border-0"
                  onClick={() => handleRowClick(account)}
                >
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-blue-600">
                          {account.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-slate-800 truncate max-w-[160px]">
                        {account.full_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 hidden sm:table-cell">
                    <span className="text-sm text-slate-500 truncate max-w-[200px] block">
                      {account.email}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 hidden md:table-cell">
                    <span className="text-sm text-slate-600 truncate max-w-[160px] block">
                      {account.org_name ?? (
                        <span className="text-slate-300">—</span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    {account.is_active ? (
                      <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Active</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-500 text-xs font-medium">
                        <XCircle className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Inactive</span>
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-3 hidden sm:table-cell">
                    {account.is_deleted ? (
                      <StatusBadge variant="deleted" />
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3 hidden lg:table-cell">
                    <span className="text-xs text-slate-400">
                      {account.created_at
                        ? format(new Date(account.created_at), "MMM d, yyyy")
                        : "—"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
      </div>

      {/* Detail Sheet */}
      <OrgAccountDetailSheet
        account={selectedAccount}
        linkedOrg={linkedOrg}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  );
}
