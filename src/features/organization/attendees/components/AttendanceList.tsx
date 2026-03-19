import { Badge } from "@/components/ui/badge";
import { EventAttendance } from "../../log-attendance/types";
import {
  ArrowRight,
  ArrowLeft,
  Clock,
  Users,
  AlertTriangle,
  UserX,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState, useCallback, useMemo } from "react";
import { CACHE_DURATIONS } from "@/services/cacheService";
import { batchGetPrograms } from "@/firebase/programBatch";
// Global program cache to prevent redundant fetches
const programCache = new Map<string, { name: string; timestamp: number }>();

// Prefetch and cache all programs for better performance
const prefetchPrograms = async (programIds: string[]) => {
  // Only prefetch programs not already in the cache
  const uniqueIds = [...new Set(programIds)].filter((id) => {
    const cached = programCache.get(id);
    const now = Date.now();
    return !cached || now - cached.timestamp >= CACHE_DURATIONS.PROGRAMS;
  });
  if (uniqueIds.length === 0) return;
  try {
    const programsMap = await batchGetPrograms(uniqueIds);
    // Update the local cache
    const now = Date.now();
    Object.entries(programsMap).forEach(([id, program]) => {
      programCache.set(id, {
        name: program.name || "Unknown Program",
        timestamp: now,
      });
    });
  } catch (error) {
    console.error("Error prefetching programs:", error);
  }
};

interface AttendanceListProps {
  attendees: EventAttendance[];
  totalAttendees?: number;
  currentPage?: number;
  totalPages?: number;
}

// Helper function to get remark styling
const getRemarkStyles = (remark: string) => {
  switch (remark?.toLowerCase()) {
    case "registered in different program":
      return {
        bg: "bg-red-50 dark:bg-red-900/10",
        text: "text-red-700 dark:text-red-400",
        border: "border-red-200 dark:border-red-800",
        icon: <AlertTriangle className="h-3 w-3" />,
      };
    case "registered in different faculty":
      return {
        bg: "bg-orange-50 dark:bg-orange-900/10",
        text: "text-orange-700 dark:text-orange-400",
        border: "border-orange-200 dark:border-orange-800",
        icon: <UserX className="h-3 w-3" />,
      };
    default:
      return {
        bg: "",
        text: "",
        border: "",
        icon: null,
      };
  }
};

export function AttendanceList({
  attendees,
  totalAttendees,
  currentPage,
  totalPages,
}: AttendanceListProps) {
  // Format timestamps for display
  const formatTime = useCallback((timestamp: string) => {
    if (!timestamp) return "Not recorded";
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;

    return `${formattedHours}:${minutes} ${ampm}`;
  }, []);

  // Extract all unique program IDs from attendees
  const programIds = useMemo(() => {
    return [
      ...new Set(
        attendees
          .map((a) => a.student?.programId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
  }, [attendees]);

  // Calculate remark statistics
  const remarkStats = useMemo(() => {
    const stats = {
      total: 0,
      programMismatch: 0,
      facultyMismatch: 0,
      other: 0,
    };

    attendees.forEach((attendee) => {
      if (attendee.remark) {
        stats.total++;
        const remarkLower = attendee.remark.toLowerCase();
        if (remarkLower.includes("registered in different program")) {
          stats.programMismatch++;
        } else if (remarkLower.includes("registered in different faculty")) {
          stats.facultyMismatch++;
        } else {
          stats.other++;
        }
      }
    });

    return stats;
  }, [attendees]);

  // Prefetch programs when attendees change, with debounce
  useEffect(() => {
    if (programIds.length === 0) return;

    const timer = setTimeout(() => {
      prefetchPrograms(programIds);
    }, 100); // Small debounce to handle rapid changes

    return () => clearTimeout(timer);
  }, [programIds]);

  return (
    <div
      className="rounded-xl"
      style={{
        background:
          "linear-gradient(135deg, #ffffff 10%, #EAF3DE 100%, #C0DD97 100%)",
        boxShadow: "0 4px 24px 0 rgba(5,140,17,0.08)",
      }}
    >
      {/* Header */}
      <div
        className="px-4 sm:px-6 py-4 sm:py-6 border-b"
        style={{ borderColor: "#C0DD97" }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center shadow-sm"
              style={{
                background: "linear-gradient(135deg, #058C11, #38B000)",
              }}
            >
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3
                className="font-nunito text-xl font-bold"
                style={{ color: "#27500A" }}
              >
                Attendance Records
              </h3>
              <div
                className="flex items-center gap-2 font-nunito-sans text-sm"
                style={{ color: "#3B6D11" }}
              >
                <span>
                  {attendees.length} of {totalAttendees || attendees.length}{" "}
                  attendees
                </span>
                {remarkStats.total > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-red-600 font-medium">
                      {remarkStats.total} with remarks
                    </span>
                  </>
                )}
                {currentPage && totalPages && totalPages > 1 && (
                  <>
                    <span>•</span>
                    <span>
                      Page {currentPage} of {totalPages}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div
            className="mt-4 p-3 rounded-lg border"
            style={{ background: "#ffffff", borderColor: "#C0DD97" }}
          >
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="h-5"
                  style={{
                    background: "#EAF3DE",
                    color: "#27500A",
                    borderColor: "#97C459",
                  }}
                >
                  <ArrowRight className="h-3 w-3 mr-1" />
                </Badge>
                <span style={{ color: "#3B6D11" }}>Time-In</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="h-5 bg-amber-50 text-amber-700 border-amber-200"
                >
                  <ArrowLeft className="h-3 w-3 mr-1" />
                </Badge>
                <span style={{ color: "#3B6D11" }}>Time-Out</span>
              </div>
              {remarkStats.programMismatch > 0 && (
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="h-5 bg-red-50 text-red-700 border-red-200"
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                  </Badge>
                  <span style={{ color: "#3B6D11" }}>Program Issue</span>
                </div>
              )}
              {remarkStats.facultyMismatch > 0 && (
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="h-5 bg-orange-50 text-orange-700 border-orange-200"
                  >
                    <UserX className="h-3 w-3 mr-1" />
                  </Badge>
                  <span style={{ color: "#3B6D11" }}>Faculty Issue</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Remark stats pills */}
        {remarkStats.total > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {remarkStats.programMismatch > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-700 text-xs font-medium">
                <AlertTriangle className="h-3 w-3" />
                <span>{remarkStats.programMismatch} Program Mismatch</span>
              </div>
            )}
            {remarkStats.facultyMismatch > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 text-orange-700 text-xs font-medium">
                <UserX className="h-3 w-3" />
                <span>{remarkStats.facultyMismatch} Faculty Mismatch</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* List */}
      {attendees.length > 0 ? (
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          <div className="space-y-3">
            {attendees.map(({ id, student, timeIn, timeOut, remark }) => {
              if (!student) return null;
              const remarkStyles = getRemarkStyles(remark!);
              const hasRemark = Boolean(remark);

              return (
                <div
                  key={id || student.studentId}
                  className={`group relative p-4 rounded-lg border pb-5 transition-all duration-200 hover:shadow-md ${
                    hasRemark ? `${remarkStyles.bg} ${remarkStyles.border}` : ""
                  }`}
                  style={
                    !hasRemark
                      ? {
                          background: "#ffffff",
                          borderColor: "#C0DD97",
                        }
                      : undefined
                  }
                  onMouseEnter={
                    !hasRemark
                      ? (e) => {
                          (e.currentTarget as HTMLElement).style.background =
                            "#EAF3DE";
                          (e.currentTarget as HTMLElement).style.borderColor =
                            "#97C459";
                        }
                      : undefined
                  }
                  onMouseLeave={
                    !hasRemark
                      ? (e) => {
                          (e.currentTarget as HTMLElement).style.background =
                            "#ffffff";
                          (e.currentTarget as HTMLElement).style.borderColor =
                            "#C0DD97";
                        }
                      : undefined
                  }
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Student info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="relative">
                        <Avatar
                          className="h-10 w-10 border-2 shadow-sm"
                          style={{ borderColor: "#97C459" }}
                        >
                          <AvatarFallback
                            className="font-semibold text-white"
                            style={{
                              background:
                                "linear-gradient(135deg, #058C11, #38B000)",
                            }}
                          >
                            {student.firstName?.[0]}
                            {student.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        {hasRemark && (
                          <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 border-2 border-white" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4
                          className="font-nunito font-semibold truncate"
                          style={{ color: "#27500A" }}
                        >
                          {student.firstName} {student.lastName}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          <span
                            className="text-sm font-mono"
                            style={{ color: "#3B6D11" }}
                          >
                            {student.studentId}
                          </span>
                          {student.programId && (
                            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-semibold">
                              {student.programId}
                            </span>
                          )}
                        </div>
                        {hasRemark && (
                          <div className="mt-2 lg:hidden">
                            <Badge
                              variant="outline"
                              className={`${remarkStyles.bg} ${remarkStyles.text} ${remarkStyles.border} font-medium text-xs`}
                            >
                              <div className="flex items-center gap-1.5">
                                {remarkStyles.icon}
                                <span className="max-w-full break-words">
                                  {remark}
                                </span>
                              </div>
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Time records */}
                    <div className="flex flex-col gap-2 lg:flex-shrink-0">
                      {hasRemark && (
                        <div className="hidden lg:block self-end">
                          <Badge
                            variant="outline"
                            className={`${remarkStyles.bg} ${remarkStyles.text} ${remarkStyles.border} font-medium text-xs max-w-[200px]`}
                          >
                            <div className="flex items-center gap-1.5">
                              {remarkStyles.icon}
                              <span className="truncate">{remark}</span>
                            </div>
                          </Badge>
                        </div>
                      )}
                      <div className="flex flex-row gap-3 flex-wrap justify-center">
                        {/* Time-in */}
                        <Badge
                          variant="outline"
                          className="flex items-center h-8 px-3 font-medium"
                          style={
                            timeIn
                              ? {
                                  background: "#EAF3DE",
                                  color: "#27500A",
                                  borderColor: "#97C459",
                                }
                              : {
                                  background: "#f9fafb",
                                  color: "#6b7280",
                                  borderColor: "#e5e7eb",
                                }
                          }
                        >
                          <ArrowRight className="h-3 w-3 mr-2 flex-shrink-0" />
                          <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="text-xs whitespace-nowrap">
                            {formatTime(timeIn) || "Not recorded"}
                          </span>
                        </Badge>

                        {/* Time-out */}
                        <Badge
                          variant="outline"
                          className={`flex items-center h-8 px-3 font-medium ${
                            timeOut
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-gray-50 text-gray-500 border-gray-200"
                          }`}
                        >
                          <ArrowLeft className="h-3 w-3 mr-2 flex-shrink-0" />
                          <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="text-xs whitespace-nowrap">
                            {formatTime(timeOut) || "Not recorded"}
                          </span>
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div
              className="h-12 w-12 rounded-full flex items-center justify-center"
              style={{ background: "#EAF3DE" }}
            >
              <Users className="h-6 w-6" style={{ color: "#058C11" }} />
            </div>
            <div>
              <h4
                className="font-nunito font-semibold mb-1"
                style={{ color: "#27500A" }}
              >
                No attendance records
              </h4>
              <p className="text-sm" style={{ color: "#3B6D11" }}>
                Attendance data will appear here once students check in
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
