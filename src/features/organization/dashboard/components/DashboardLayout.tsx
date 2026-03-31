"use client";

import { MembersStats } from "./MembersStats";
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


  // deduplicate events by id
  const dedupedEvents = [...ongoingEvents, ...allEvents].filter(
    (event, index, self) =>
      self.findIndex(e => e.id === event.id) === index
  );

  if (isMobile) {
    return (
      <MobileDashboard
        isLoading={isLoading}
        studentStats={stats}
        eventAttendance={dedupedEvents}
        upcomingEvents={upcomingEvents}
        ongoingEvents={ongoingEvents}
        recentMembers={recentMembers}
        recentPayments={recentPayments}
        feesCollected={feesCollected}
        unpaidFinesAmount={unpaidFinesAmount}
        clearanceRate={clearanceRate}
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

      <MembersStats
        isLoading={isLoading}
        studentStats={stats}
        eventAttendance={dedupedEvents}
        feesCollected={feesCollected}
        unpaidFinesAmount={unpaidFinesAmount}
        clearanceRate={clearanceRate}
      />


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentPayments
          isLoading={isLoading}
          payments={recentPayments}
        />
        <RecentMembers
          isLoading={isLoading}
          recentMembers={recentMembers}
        />
      </div>
    </div>
  );
}