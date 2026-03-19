// src/features/organization/dashboard/components/MobileDashboard.tsx
import { ShortcutLinks } from "./ShortcutLinks";
import { RecentMembers } from "./RecentMembers";
import { Event } from "../types";
import { Member } from "../../members/types";
import { MobileMembersStats } from "./MobileMembersStats";
import { LayoutDashboard } from "lucide-react";

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
}

export function MobileDashboard({
  isLoading,
  studentStats,
  eventAttendance,
  upcomingEvents,
  ongoingEvents,
  recentMembers,
}: MobileDashboardProps) {
  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      {/* Mobile Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="size-5 text-primary" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Organization Dashboard
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Overview of your organization&apos;s attendance and activity.
        </p>
      </div>

      {/* Mobile Stats */}
      <MobileMembersStats
        isLoading={isLoading}
        studentStats={studentStats}
        eventAttendance={eventAttendance}
      />

      {/* Mobile Events */}
      <ShortcutLinks
        upcomingEvents={upcomingEvents}
        ongoingEvents={ongoingEvents}
        isLoading={isLoading}
      />

      {/* Mobile Recent Members */}
      <RecentMembers isLoading={isLoading} recentMembers={recentMembers} />
    </div>
  );
}