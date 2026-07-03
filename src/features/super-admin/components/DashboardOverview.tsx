"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardStats } from "@/features/super-admin/types";
import {
  Building2,
  Users,
  Archive,
  CheckCircle2,
  Layers,
  Crown,
  Star,
  Shield,
} from "lucide-react";

interface DashboardOverviewProps {
  stats: DashboardStats | null;
  isLoading?: boolean;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClassName,
  cardClassName,
  isLoading,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  iconClassName: string;
  cardClassName?: string;
  isLoading?: boolean;
}) {
  return (
    <Card
      className={`border border-blue-100 shadow-sm hover:shadow-md transition-shadow duration-200 ${cardClassName ?? ""}`}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-slate-600">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${iconClassName}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-28" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold text-slate-800">{value}</div>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardOverview({
  stats,
  isLoading = false,
}: DashboardOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Primary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Subscribed Orgs"
          value={stats?.total_subscribed ?? 0}
          subtitle={`Out of ${stats?.total_orgs ?? 0} total organizations`}
          icon={Building2}
          iconClassName="bg-blue-50 text-blue-600"
          isLoading={isLoading}
        />
        <StatCard
          title="Active Org Accounts"
          value={stats?.total_active_accounts ?? 0}
          subtitle="Active, non-deleted accounts"
          icon={Users}
          iconClassName="bg-emerald-50 text-emerald-600"
          isLoading={isLoading}
        />
        <StatCard
          title="Archived Organizations"
          value={stats?.total_archived ?? 0}
          subtitle="Organizations marked as archived"
          icon={Archive}
          iconClassName="bg-slate-100 text-slate-500"
          isLoading={isLoading}
        />
        <StatCard
          title="Total Organizations"
          value={stats?.total_orgs ?? 0}
          subtitle="All registered organizations"
          icon={Layers}
          iconClassName="bg-indigo-50 text-indigo-600"
          isLoading={isLoading}
        />
      </div>

      {/* Tier breakdown */}
      <div>
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">
          Subscription Tier Breakdown
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-slate-600">
                Basic Tier
              </CardTitle>
              <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                <Shield className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <>
                  <Skeleton className="h-8 w-12 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-slate-800">
                    {stats?.tier_counts.basic ?? 0}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">₱2 / student / yr</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border border-blue-100 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-blue-700">
                Plus Tier
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <Star className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <>
                  <Skeleton className="h-8 w-12 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-blue-800">
                    {stats?.tier_counts.plus ?? 0}
                  </div>
                  <p className="text-xs text-blue-500 mt-1">₱3 / student / yr</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border border-indigo-100 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-indigo-700">
                Premium Tier
              </CardTitle>
              <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                <Crown className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <>
                  <Skeleton className="h-8 w-12 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-indigo-800">
                    {stats?.tier_counts.premium ?? 0}
                  </div>
                  <p className="text-xs text-indigo-500 mt-1">₱4 / student / yr</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
