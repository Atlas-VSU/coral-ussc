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

// Component to display program name with optimized caching
function ProgramBadge({ programId }: { programId: string }) {
  const [programName, setProgramName] = useState(() => {
    // Initialize from global cache if available and not expired
    const cached = programCache.get(programId);
    const now = Date.now();
    if (cached && now - cached.timestamp < CACHE_DURATIONS.PROGRAMS) {
      return cached.name;
    }
    return "Loading...";
  });

  const fetchProgramName = useCallback(async () => {
    try {
      // Check global cache first (double-check in case state initialized from old data)
      const cached = programCache.get(programId);
      const now = Date.now();
      if (cached && now - cached.timestamp < CACHE_DURATIONS.PROGRAMS) {
        setProgramName(cached.name);
        return;
      }

      // Use batch function to get the program
      const programsMap = await batchGetPrograms([programId]);
      const program = programsMap[programId];

      const name = program?.name || "Unknown Program";

      // Update both the component state and global cache
      setProgramName(name);
      programCache.set(programId, { name, timestamp: now });
    } catch (error) {
      console.error("Error fetching program:", error);
      setProgramName("Unknown Program");
    }
  }, [programId]);

  // Fetch on mount or when programId changes
  useEffect(() => {
    fetchProgramName();
  }, [fetchProgramName]);

  return (
    <Badge variant="outline" className="text-xs py-0 px-1.5 h-5">
      {programName}
    </Badge>
  );
}

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
    // Use our new batch function
    console.log(`🔄 Prefetching ${uniqueIds.length} programs`);
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
        bg: "bg-gray-50 dark:bg-gray-800",
        text: "text-gray-700 dark:text-gray-300",
        border: "border-gray-200 dark:border-gray-700",
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
    <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 dark:from-gray-800 dark:via-gray-800 dark:to-gray-700/50 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-lg shadow-blue-100/50 dark:shadow-gray-900/20">
      {/* Enhanced Header */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-gray-200/60 dark:border-gray-700/60">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-nunito text-xl font-bold text-gray-900 dark:text-gray-100">
                Attendance Records
              </h3>
              <div className="flex items-center gap-2 font-nunito-sans text-sm text-gray-600 dark:text-gray-400">
                <span>
                  {attendees.length} of {totalAttendees || attendees.length}{" "}
                  attendees
                </span>
                {remarkStats.total > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-red-600 dark:text-red-400 font-medium">
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

          {/* Enhanced Legend with Remark Indicators */}
          <div className="mt-4 p-3 rounded-lg bg-gray-50/80 dark:bg-gray-800/40 border border-gray-200/60 dark:border-gray-700/60">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="h-5 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700"
                >
                  <ArrowRight className="h-3 w-3 mr-1" />
                </Badge>
                <span className="text-gray-600 dark:text-gray-400">
                  Time-In
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="h-5 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700"
                >
                  <ArrowLeft className="h-3 w-3 mr-1" />
                </Badge>
                <span className="text-gray-600 dark:text-gray-400">
                  Time-Out
                </span>
              </div>
              {remarkStats.programMismatch > 0 && (
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="h-5 bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700"
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                  </Badge>
                  <span className="text-gray-600 dark:text-gray-400">
                    Program Issue
                  </span>
                </div>
              )}
              {remarkStats.facultyMismatch > 0 && (
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="h-5 bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700"
                  >
                    <UserX className="h-3 w-3 mr-1" />
                  </Badge>
                  <span className="text-gray-600 dark:text-gray-400">
                    Faculty Issue
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Remark Statistics */}
        {remarkStats.total > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {remarkStats.programMismatch > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 text-xs font-medium">
                <AlertTriangle className="h-3 w-3" />
                <span>{remarkStats.programMismatch} Program Mismatch</span>
              </div>
            )}
            {remarkStats.facultyMismatch > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-400 text-xs font-medium">
                <UserX className="h-3 w-3" />
                <span>{remarkStats.facultyMismatch} Faculty Mismatch</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Attendance List */}
      {attendees.length > 0 ? (
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          <div className="space-y-3">
            {attendees.map(({ id, student, timeIn, timeOut, remark }) => {
              if (!student) return null;
              const remarkStyles = getRemarkStyles(remark!);

              return (
                <div
                  key={id || student.studentId}
                  className={`group relative p-4 rounded-lg border pb-5 ${
                    remark
                      ? `${remarkStyles.bg} ${remarkStyles.border}`
                      : "border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/40"
                  } backdrop-blur-sm hover:bg-white/90 dark:hover:bg-gray-800/60 hover:border-gray-300/80 dark:hover:border-gray-600/80 transition-all duration-200 hover:shadow-md`}
                >

                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Student Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="relative">
                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                            {student.firstName?.[0]}
                            {student.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        {remark && (
                          <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 dark:bg-red-600 border-2 border-white dark:border-gray-800" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-nunito font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {student.firstName} {student.lastName}
                            </h4>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                            {student.studentId}
                          </span>
                          {student.programId && (
                            <ProgramBadge programId={student.programId} />
                          )}
                        </div>
                        {remark && (
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
                        {remark && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 italic lg:hidden">
                            Requires attention
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Time Records */}
                    <div className="flex flex-col gap-2 lg:flex-shrink-0">
                      {remark && (
                        <div className="hidden lg:block self-end">
                          <Badge
                            variant="outline"
                            className={`${remarkStyles.bg} ${remarkStyles.text} ${remarkStyles.border} font-medium text-xs max-w-[200px]`}
                          >
                            <div className="flex items-center gap-1.5">
                              {remarkStyles.icon}
                              <span className="truncate">
                                {remark}
                              </span>
                            </div>
                          </Badge>
                        </div>
                      )}
                      <div className="flex flex-row gap-3 flex-wrap justify-center">
                        {/* Check-in Badge */}
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`flex items-center h-8 px-3 font-medium ${
                              timeIn
                                ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700"
                                : "bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800/20 dark:text-gray-400 dark:border-gray-700"
                            }`}
                          >
                            <ArrowRight className="h-3 w-3 mr-2 flex-shrink-0" />
                            <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="text-xs whitespace-nowrap">
                              {formatTime(timeIn) || "Not recorded"}
                            </span>
                          </Badge>
                        </div>

                        {/* Check-out Badge */}
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`flex items-center h-8 px-3 font-medium ${
                              timeOut
                                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700"
                                : "bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800/20 dark:text-gray-400 dark:border-gray-700"
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
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Users className="h-6 w-6 text-gray-400" />
            </div>
            <div>
              <h4 className="font-nunito font-semibold text-gray-900 dark:text-gray-100 mb-1">
                No attendance records
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Attendance data will appear here once students check in
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
