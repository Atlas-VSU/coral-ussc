"use client";

// src/features/organization/dashboard/components/MobileDashboard.tsx
import { ShortcutLinks } from "./ShortcutLinks";
import { RecentMembers } from "./RecentMembers";
import { RecentPayments, DashboardPayment } from "./RecentPayments";
import { Event } from "../types";
import { Member } from "../../members/types";
import { MobileMembersStats } from "./MobileMembersStats";
import { PageHeader } from "@/components/organization/general/PageHeader";

interface StudentStats {
  totalStudents: number;
  totalEvents: number;
  overallAttendanceRate: number;
  averageAttendance: number;
  totalAttendances: number;
  peakAttendance: number;
  totalAbsences: number;
}

interface MobileDashboardProps {
  isLoading: boolean;
  studentStats: StudentStats;
  eventAttendance: Event[];
  upcomingEvents: Event[];
  ongoingEvents: Event[];
  recentMembers: Member[];
  recentPayments: DashboardPayment[];
  feesCollected: number;
  unpaidFinesAmount: number;
  clearanceRate: number;
  AY: string;
  sem: string;
}

export function MobileDashboard({
  isLoading,
  studentStats,
  eventAttendance,
  upcomingEvents,
  ongoingEvents,
  recentMembers,
  recentPayments,
  feesCollected,
  unpaidFinesAmount,
  clearanceRate,
  AY,
  sem,
}: MobileDashboardProps) {
  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
      <PageHeader
        variant="admin"
        title="Dashboard"
        context={`${sem} Semester · A.Y. ${AY}`}
        description="Overview of your organization's attendance and activity."
      />

      {/* Stat cards + attendance chart */}
      <MobileMembersStats
        isLoading={isLoading}
        studentStats={studentStats}
        eventAttendance={eventAttendance}
        feesCollected={feesCollected}
        unpaidFinesAmount={unpaidFinesAmount}
        clearanceRate={clearanceRate}
      />

      {/* Recent Transactions */}
      <RecentPayments
        isLoading={isLoading}
        payments={recentPayments}
      />

      {/* Events */}
      <ShortcutLinks
        upcomingEvents={upcomingEvents}
        ongoingEvents={ongoingEvents}
        isLoading={isLoading}
      />

      {/* Recent Members */}
      <RecentMembers isLoading={isLoading} recentMembers={recentMembers} />
    </div>
  );
}