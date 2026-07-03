"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "./StatusBadge";
import { TierBadge } from "./TierBadge";
import type {
  SuperAdminOrgAccount,
  SuperAdminOrg,
} from "@/features/super-admin/types";
import {
  User,
  Mail,
  Calendar,
  Building2,
  Tag,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  XCircle,
  CreditCard,
  Archive,
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface OrgAccountDetailSheetProps {
  account: SuperAdminOrgAccount | null;
  linkedOrg: SuperAdminOrg | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      {Icon ? (
        <div className="mt-0.5 shrink-0 text-blue-500">
          <Icon className="h-4 w-4" />
        </div>
      ) : (
        <div className="w-4 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <div className="text-sm text-slate-800 font-medium">{value}</div>
      </div>
    </div>
  );
}

const levelLabels: Record<string, string> = {
  department: "Department",
  faculty: "Faculty",
  council: "Council",
};

export function OrgAccountDetailSheet({
  account,
  linkedOrg,
  open,
  onOpenChange,
}: OrgAccountDetailSheetProps) {
  if (!account) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-white border-l border-blue-100 p-0 flex flex-col"
      >
        <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-16">
          <SheetHeader className="p-0 pb-2 pr-8">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-600 shrink-0">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <SheetTitle className="text-base font-bold text-slate-800 leading-tight">
                  {account.full_name}
                </SheetTitle>
                <SheetDescription className="text-sm text-slate-500 mt-0.5">
                  {account.email}
                </SheetDescription>
              </div>
            </div>

            {/* Status badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              {linkedOrg?.subscription_tier && <TierBadge tier={linkedOrg.subscription_tier} />}
              <StatusBadge variant={account.is_active ? "active" : "inactive"} />
              {account.is_deleted && <StatusBadge variant="deleted" />}
            </div>
          </SheetHeader>

          <Separator className="bg-blue-50" />

          {/* Account Details */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Account Details
            </h3>
            <div className="divide-y divide-slate-50 border border-slate-100 rounded-lg bg-slate-50/50 p-2">
              <DetailRow
                icon={User}
                label="Full Name"
                value={account.full_name}
              />
              <DetailRow
                icon={Mail}
                label="Email Address"
                value={account.email}
              />
              <DetailRow
                icon={User}
                label="Active Status"
                value={
                  account.is_active ? (
                    <span className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-500">
                      <XCircle className="h-3.5 w-3.5" /> Inactive
                    </span>
                  )
                }
              />
              <DetailRow
                icon={XCircle}
                label="Deletion Status"
                value={
                  account.is_deleted ? (
                    <StatusBadge variant="deleted" />
                  ) : (
                    <span className="text-emerald-600 text-sm">Not deleted</span>
                  )
                }
              />
              <DetailRow
                icon={Calendar}
                label="Created At"
                value={
                  account.created_at
                    ? format(new Date(account.created_at), "PPP p")
                    : "—"
                }
              />
            </div>
          </section>

          <Separator className="bg-blue-50" />

          {/* Linked Organization */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Linked Organization
            </h3>
            {linkedOrg ? (
              <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2 divide-y divide-slate-50">
                <DetailRow
                  icon={Building2}
                  label="Name"
                  value={linkedOrg.name}
                />
                <DetailRow
                  icon={Tag}
                  label="Short Name"
                  value={linkedOrg.short_name || "—"}
                />
                <DetailRow
                  icon={GraduationCap}
                  label="Level"
                  value={
                    <Badge
                      variant="outline"
                      className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                    >
                      {levelLabels[linkedOrg.level] ?? linkedOrg.level}
                    </Badge>
                  }
                />
                <DetailRow
                  icon={BookOpen}
                  label="Faculty"
                  value={
                    linkedOrg.faculty_name
                      ? `${linkedOrg.faculty_name}${linkedOrg.faculty_acronym ? ` (${linkedOrg.faculty_acronym})` : ""}`
                      : "—"
                  }
                />
                <DetailRow
                  icon={BookOpen}
                  label="Program"
                  value={
                    linkedOrg.program_name
                      ? `${linkedOrg.program_name}${linkedOrg.program_acronym ? ` (${linkedOrg.program_acronym})` : ""}`
                      : "—"
                  }
                />
                <DetailRow
                  icon={CreditCard}
                  label="Subscription Tier"
                  value={<TierBadge tier={linkedOrg.subscription_tier} />}
                />
                <DetailRow
                  icon={CheckCircle2}
                  label="Subscribed"
                  value={
                    linkedOrg.subscribed ? (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Yes
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-400">
                        <XCircle className="h-3.5 w-3.5" /> No
                      </span>
                    )
                  }
                />
                {linkedOrg.is_archived && (
                  <DetailRow
                    icon={Archive}
                    label="Archived"
                    value={<StatusBadge variant="archived" />}
                  />
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-blue-100 bg-slate-50 px-4 py-8 text-center">
                <Building2 className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400 font-medium">
                  Linked organization not found
                </p>
              </div>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
