"use client";

import { MembersStats } from "./MembersStats";
import { ShortcutLinks } from "./ShortcutLinks";
import { RecentMembers } from "./RecentMembers";
import { RecentPayments } from "./RecentPayments";
import { MobileDashboard } from "./MobileDashboard";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useDashboard } from "../hooks/useDashboard";
import { PageHeader } from "@/components/organization/PageHeader";

export function DashboardLayout() {
  const {
    stats,
    upcomingEvents,
    ongoingEvents,
    allEvents,
    recentMembers,
    recentPayments,
    feesCollected,
    unpaidFinesAmount,
    clearanceRate,
    isLoading,
  } = useDashboard();

  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <MobileDashboard
        isLoading={isLoading}
        studentStats={stats}
        eventAttendance={[...ongoingEvents, ...allEvents]}
        upcomingEvents={upcomingEvents}
        ongoingEvents={ongoingEvents}
        recentMembers={recentMembers}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        variant="admin"
        title="Dashboard"
        context="2nd Semester · A.Y. 2025–2026"
        description="Overview of your organization's attendance and activity."
      />

      {/* Stat cards + attendance chart */}
      <MembersStats
        isLoading={isLoading}
        studentStats={stats}
        eventAttendance={[...ongoingEvents, ...allEvents]}
        feesCollected={feesCollected}
        unpaidFinesAmount={unpaidFinesAmount}
        clearanceRate={clearanceRate}
      />

      {/* Bottom grid: Transactions + Events + Members — equal 3-col */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RecentPayments
          isLoading={isLoading}
          payments={recentPayments}
        />

        <ShortcutLinks
          upcomingEvents={upcomingEvents}
          ongoingEvents={ongoingEvents}
          isLoading={isLoading}
        />

        <RecentMembers
          isLoading={isLoading}
          recentMembers={recentMembers}
        />
      </div>
    </div>
  );
}