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
import { Badge } from "@/components/ui/badge";
import { TierBadge } from "./TierBadge";
import { StatusBadge } from "./StatusBadge";
import { OrgDetailSheet } from "./OrgDetailSheet";
import { TableSkeleton } from "./TableSkeleton";
import type {
  SuperAdminOrg,
  SuperAdminOrgAccount,
  OrgLevel,
  SubscriptionTier,
} from "@/features/super-admin/types";
import { Building2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface OrgsTableProps {
  orgs: SuperAdminOrg[];
  accounts: SuperAdminOrgAccount[];
  isLoading?: boolean;
}

const levelLabels: Record<OrgLevel, string> = {
  department: "Department",
  faculty: "Faculty",
  council: "Council",
};

export function OrgsTable({ orgs, accounts, isLoading = false }: OrgsTableProps) {
  const [levelFilter, setLevelFilter] = useState<OrgLevel | "all">("all");
  const [tierFilter, setTierFilter] = useState<SubscriptionTier | "all">("all");
  const [archivedFilter, setArchivedFilter] = useState<"all" | "active" | "archived">("all");
  const [search, setSearch] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<SuperAdminOrg | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const filtered = useMemo(() => {
    return orgs.filter((org) => {
      if (levelFilter !== "all" && org.level !== levelFilter) return false;
      if (tierFilter !== "all" && org.subscription_tier !== tierFilter) return false;
      if (archivedFilter === "active" && org.is_archived) return false;
      if (archivedFilter === "archived" && !org.is_archived) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          org.name.toLowerCase().includes(q) ||
          org.short_name.toLowerCase().includes(q) ||
          (org.faculty_name?.toLowerCase().includes(q) ?? false) ||
          (org.program_name?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [orgs, levelFilter, tierFilter, archivedFilter, search]);

  const linkedAccounts = selectedOrg
    ? accounts.filter((a) => a.org_id === selectedOrg.id)
    : [];

  const handleRowClick = (org: SuperAdminOrg) => {
    setSelectedOrg(org);
    setSheetOpen(true);
  };

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm border-blue-100 focus-visible:ring-blue-300"
          />
        </div>

        <Select
          value={levelFilter}
          onValueChange={(v) => setLevelFilter(v as OrgLevel | "all")}
        >
          <SelectTrigger className="w-[160px] h-9 text-sm border-blue-100">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="department">Department</SelectItem>
            <SelectItem value="faculty">Faculty</SelectItem>
            <SelectItem value="council">Council</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={tierFilter}
          onValueChange={(v) => setTierFilter(v as SubscriptionTier | "all")}
        >
          <SelectTrigger className="w-[160px] h-9 text-sm border-blue-100">
            <SelectValue placeholder="All Tiers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="basic">Basic</SelectItem>
            <SelectItem value="plus">Plus</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={archivedFilter}
          onValueChange={(v) => setArchivedFilter(v as typeof archivedFilter)}
        >
          <SelectTrigger className="w-[160px] h-9 text-sm border-blue-100">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="archived">Archived Only</SelectItem>
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
                Name
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-3">
                Short Name
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-3">
                Level
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 hidden md:table-cell">
                Faculty
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 hidden lg:table-cell">
                Program
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-3">
                Tier
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 hidden sm:table-cell">
                Subscribed
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 hidden sm:table-cell">
                Archived
              </TableHead>
            </TableRow>
          </TableHeader>

          {isLoading ? (
            <TableSkeleton rows={6} cols={8} />
          ) : filtered.length === 0 ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={8}>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Building2 className="h-10 w-10 text-slate-200 mb-3" />
                    <p className="text-sm font-medium text-slate-500">
                      No organizations found
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
              {filtered.map((org) => (
                <TableRow
                  key={org.id}
                  className="cursor-pointer hover:bg-blue-50/50 transition-colors border-b border-slate-50 last:border-0"
                  onClick={() => handleRowClick(org)}
                >
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
                        <Building2 className="h-3.5 w-3.5 text-blue-500" />
                      </div>
                      <span className="text-sm font-medium text-slate-800 truncate max-w-[180px]">
                        {org.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="text-sm text-slate-600 font-mono text-xs">
                      {org.short_name || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge
                      variant="outline"
                      className="text-xs bg-blue-50 text-blue-700 border-blue-100"
                    >
                      {levelLabels[org.level] ?? org.level}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 hidden md:table-cell">
                    <span className="text-sm text-slate-600">
                      {org.faculty_acronym ?? org.faculty_name ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 hidden lg:table-cell">
                    <span className="text-sm text-slate-600">
                      {org.program_acronym ?? org.program_name ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <TierBadge tier={org.subscription_tier} />
                  </TableCell>
                  <TableCell className="py-3 hidden sm:table-cell">
                    <StatusBadge
                      variant={org.subscribed ? "subscribed" : "unsubscribed"}
                    />
                  </TableCell>
                  <TableCell className="py-3 hidden sm:table-cell">
                    {org.is_archived ? (
                      <StatusBadge variant="archived" />
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
      </div>

      {/* Detail Sheet */}
      <OrgDetailSheet
        org={selectedOrg}
        linkedAccounts={linkedAccounts}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  );
}
