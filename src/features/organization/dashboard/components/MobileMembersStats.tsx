"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  UserX,
  Users,
  Calendar,
  CheckCircle,
  BarChart3,
  Activity,
} from "lucide-react";
import { Event } from "../types";
import { useEffect, useState } from "react";
import { getEventById } from "@/firebase";

interface MembersStatsProps {
  isLoading?: boolean;
  studentStats: {
    totalStudents: number;
    totalEvents: number;
    overallAttendanceRate: number;
    averageAttendance: number;
    totalAttendances: number;
    peakAttendance: number;
    totalAbsences: number;
  };
  eventAttendance: Event[];
  selectedEvent?: Event | null;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    payload: {
      name: string;
      displayName: string;
      Present: number;
      Absent: number;
      date: string;
      attendanceRate: string;
    };
  }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    const event = payload[0].payload;

    return (
      <div className="rounded-xl border border-border/80 bg-background/98 backdrop-blur-md p-4 shadow-xl max-w-xs">
        <p className="font-bold text-base mb-4 text-foreground flex items-center gap-3">
          <Calendar className="h-5 w-5 text-primary" />
          {label}
        </p>
        <div className="space-y-3">
          {payload.map(
            (
              entry: {
                name: string;
                value: number;
                color: string;
                payload: {
                  name: string;
                  displayName: string;
                  Present: number;
                  Absent: number;
                  date: string;
                  attendanceRate: string;
                };
              },
              index: number
            ) => (
              <div
                key={`item-${index}`}
                className="flex items-center gap-4 p-2 rounded-lg bg-muted/50"
              >
                <div
                  className="w-4 h-4 rounded-full shadow-sm border border-border/50"
                  style={{ backgroundColor: entry.color }}
                ></div>
                <div className="flex-1 flex justify-between items-center">
                  <span className="text-sm font-semibold text-foreground">
                    {entry.name}:
                  </span>
                  <span className="text-base font-bold text-foreground">
                    {entry.value}
                  </span>
                </div>
              </div>
            )
          )}
          {event && event.attendanceRate && (
            <div className="pt-3 mt-3 border-t border-border/50">
              <div className="flex items-center gap-4 p-2 rounded-lg bg-primary/5 border border-primary/20">
                <div className="w-4 h-4 rounded-full bg-green-500 shadow-sm"></div>
                <div className="flex-1 flex justify-between items-center">
                  <span className="text-sm font-semibold text-foreground">
                    Rate:
                  </span>
                  <span className="text-base font-bold text-primary">
                    {event.attendanceRate}%
                  </span>
                </div>
              </div>
            </div>
          )}
          {event && event.date && (
            <p className="text-xs text-muted-foreground flex items-center gap-2 pt-2 font-medium">
              <Calendar className="h-4 w-4" />
              {new Date(event.date).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export function MobileMembersStats({
  isLoading = false,
  studentStats,
  eventAttendance,
  selectedEvent = null,
}: MembersStatsProps) {
  // const preparedChartData = () => {
  //   if (selectedEvent) {
  //     // Single event chart data
  //     return [
  //       {
  //         const totalMembers = studentStats.totalStudents;
  //       const presentCount = eventPresentCounts[event.id] || 0;
  //       const absent = totalMembers - presentCount;
  //       return {
  //         name: event.name,
  //         displayName: `Event ${index + 1}`,
  //         Present: presentCount,
  //         Absent: absent > 0 ? absent : 0,
  //         date: event.date,
  //         attendanceRate: presentCount
  //           ? ((presentCount / totalMembers) * 100).toFixed(1)
  //           : 0,
  //       };
  //       }
  //     ];
  //   } else {
  //     // All events chart data (limited to top 5 for mobile)
  //     return eventAttendance.slice(0, 5).map((event) => ({
  //       name: event.name.length > 15
  //         ? event.name.substring(0, 15) + "..."
  //         : event.name,
  //       attendances: event.attendanceCount || 0,
  //       capacity: event.capacity || event.expectedAttendees || 100,
  //     }));
  //   }
  // }

  const [internalSelectedEvent, setInternalSelectedEvent] =
    useState<Event | null>(selectedEvent);
  const [selectedEventPresentCount, setSelectedEventPresentCount] = useState<
    number | null
  >(null);
  const [isFetchingEventData, setIsFetchingEventData] = useState(false);
  const [chartType, setChartType] = useState<"bar" | "pie">("pie");

  // Fetch attendance data for selected event
  useEffect(() => {
    const fetchSelectedEventData = async () => {
      if (!internalSelectedEvent) {
        setSelectedEventPresentCount(null);
        return;
      }

      setIsFetchingEventData(true);
      try {
        const count =
          ((await getEventById(internalSelectedEvent.id)) as unknown as Event)
            .attendees || 0;
        setSelectedEventPresentCount(count);
      } catch (error) {
        console.error("Error fetching event attendance:", error);
        setSelectedEventPresentCount(0);
      } finally {
        setIsFetchingEventData(false);
      }
    };

    fetchSelectedEventData();
  }, [internalSelectedEvent]);

  const prepareChartData = () => {
    if (!internalSelectedEvent || selectedEventPresentCount === null) {
      return [];
    }

    const totalMembers = studentStats.totalStudents;
    const presentCount = selectedEventPresentCount;
    const absent = totalMembers - presentCount;

    return [
      {
        name:
          internalSelectedEvent.name.length > 20
            ? internalSelectedEvent.name.substring(0, 20) + "..."
            : internalSelectedEvent.name,
        displayName: "Selected Event",
        Present: presentCount,
        Absent: absent > 0 ? absent : 0,
        date: internalSelectedEvent.date,
        attendanceRate: presentCount
          ? ((presentCount / totalMembers) * 100).toFixed(1)
          : "0",
      },
    ];
  };

  const chartData = prepareChartData();

  const COLORS = {
    present: "hsl(142 76% 36%)", // Emerald green
    absent: "hsl(0 84% 60%)", // Red
  };
  const getChartColors = () => {
    if (typeof window !== "undefined") {
      const computedStyle = getComputedStyle(document.documentElement);
      return {
        textColor:
          computedStyle.getPropertyValue("--muted-foreground").trim() ||
          "#6b7280",
        borderColor:
          computedStyle.getPropertyValue("--border").trim() || "#e5e7eb",
        backgroundColor:
          computedStyle.getPropertyValue("--background").trim() || "#ffffff",
        foregroundColor:
          computedStyle.getPropertyValue("--foreground").trim() || "#000000",
      };
    }
    return {
      textColor: "#6b7280",
      backgroundColor: "#ffffff",
      foregroundColor: "#000000",
    };
  };

  const chartColors = getChartColors();
  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Stats Grid - Fully Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {/* Total Students Card */}
        <Card className="p-3 lg:p-4 hover:shadow-md transition-shadow group relative overflow-hidden bg-gradient-to-br from-blue-50 via-blue-100/80 to-indigo-100 dark:from-blue-950/90 dark:via-blue-900/80 dark:to-indigo-950/90 border-0 shadow-xl duration-500 hover:scale-[1.02] backdrop-blur-sm animate-fade-in-up animation-delay-400">
          <CardContent className="p-0">
            <div className="flex items-center space-x-3 lg:space-x-4">
              <div className="p-2 lg:p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <Users className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-muted-foreground">
                  Total Students
                </p>
                <div className="text-lg lg:text-xl font-bold text-foreground">
                  {isLoading ? (
                    <Skeleton className="h-5 w-12 lg:h-6 lg:w-16" />
                  ) : (
                    studentStats.totalStudents.toLocaleString()
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Events Card */}
        <Card className="p-3 lg:p-4 hover:shadow-md transition-shadow group relative overflow-hidden bg-gradient-to-br from-emerald-50 via-emerald-100/80 to-teal-100 dark:from-emerald-950/90 dark:via-emerald-900/80 dark:to-teal-950/90 border-0 shadow-lg duration-500 hover:scale-[1.02] backdrop-blur-sm animate-fade-in-up animation-delay-600">
          <CardContent className="p-0">
            <div className="flex items-center space-x-3 lg:space-x-4">
              <div className="p-2 lg:p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                <Calendar className="h-4 w-4 lg:h-5 lg:w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-muted-foreground">
                  Total Events
                </p>
                <div className="text-lg lg:text-xl font-bold text-foreground">
                  {isLoading ? (
                    <Skeleton className="h-5 w-12 lg:h-6 lg:w-16" />
                  ) : (
                    studentStats.totalEvents.toLocaleString()
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Attendances Card */}
        <Card className="p-3 lg:p-4 hover:shadow-md transition-shadow group relative overflow-hidden bg-gradient-to-br from-purple-50 via-purple-100/80 to-violet-100 dark:from-purple-950/90 dark:via-purple-900/80 dark:to-violet-950/90 border-0 shadow-lg duration-500 hover:scale-[1.02] backdrop-blur-sm animate-fade-in-up animation-delay-800">
          <CardContent className="p-0">
            <div className="flex items-center space-x-3 lg:space-x-4">
              <div className="p-2 lg:p-3 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <CheckCircle className="h-4 w-4 lg:h-5 lg:w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-muted-foreground">
                  Total Attendances
                </p>
                <div className="text-lg lg:text-xl font-bold text-foreground">
                  {isLoading ? (
                    <Skeleton className="h-5 w-12 lg:h-6 lg:w-16" />
                  ) : (
                    studentStats.totalAttendances.toLocaleString()
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Absences Card */}
        <Card className="p-3 lg:p-4 hover:shadow-md transition-shadow group relative overflow-hidden bg-gradient-to-br from-red-50 via-orange-100/80 to-red-100 dark:from-red-950/90 dark:via-orange-900/80 dark:to-red-950/90 border-0 shadow-lg duration-500 hover:scale-[1.02] backdrop-blur-sm animate-fade-in-up animation-delay-1000">
          <CardContent className="p-0">
            <div className="flex items-center space-x-3 lg:space-x-4">
              <div className="p-2 lg:p-3 bg-red-100 dark:bg-red-900/50 rounded-lg">
                <UserX className="h-4 w-4 lg:h-5 lg:w-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-muted-foreground">
                  Total Absences
                </p>
                <div className="text-lg lg:text-xl font-bold text-foreground">
                  {isLoading ? (
                    <Skeleton className="h-5 w-12 lg:h-6 lg:w-16" />
                  ) : (
                    studentStats.totalAbsences.toLocaleString()
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Container - Responsive */}
      <Card className="p-4 lg:p-6 group relative overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-background via-background/95 to-muted/30 backdrop-blur-xl animate-fade-in-up animation-delay-600">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-col sm:items-start sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg lg:text-xl">
                {internalSelectedEvent
                  ? `${internalSelectedEvent.name} Attendance`
                  : "Attendance Overview"}
              </CardTitle>
              <CardDescription className="text-sm lg:text-base">
                {internalSelectedEvent
                  ? "Detailed attendance breakdown for this event"
                  : "Select an event above to view detailed attendance"}
              </CardDescription>
            </div>
            <Select
              value={internalSelectedEvent?.id || ""}
              onValueChange={(value) => {
                const event = eventAttendance.find((e) => e.id === value);
                setInternalSelectedEvent(event || null);
              }}
            >
              <SelectTrigger className="w-full h-12 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-2 border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 focus:border-slate-400 dark:focus:border-slate-500 transition-all duration-300 shadow-md hover:shadow-lg rounded-lg font-medium text-sm overflow-hidden px-4 py-3">
                <SelectValue
                  placeholder={
                    <div className="flex items-center gap-3">
                      <span className="text-slate-600 dark:text-slate-400 font-medium text-sm">
                        Select Event for Analysis
                      </span>
                    </div>
                  }
                >
                  {internalSelectedEvent && (
                    <div className="flex items-center justify-between gap-3 min-w-0">
                      <div className="flex items-center justify-between min-w-0 gap-5">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 truncate text-sm leading-tight">
                          {internalSelectedEvent.name}
                        </div>
                        <div className="gap-2 text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                          <span className="font-medium">
                            {new Date(
                              internalSelectedEvent.date
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white/98 dark:bg-gray-900/98 backdrop-blur-md border-2 border-slate-200/80 dark:border-slate-700/80 shadow-xl rounded-lg max-h-80">
                {eventAttendance.map((event, index) => (
                  <SelectItem
                    key={event.id}
                    value={event.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-all duration-200 p-3 cursor-pointer rounded-md mx-1 my-1 font-medium"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center shadow-sm border border-slate-200/50 dark:border-slate-600/50">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-900 dark:text-slate-100 truncate text-sm leading-tight">
                            {event.name}
                          </span>
                          {internalSelectedEvent?.id === event.id && (
                            <div className="w-2 h-2 rounded-full bg-slate-600 animate-pulse shadow-sm"></div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <Calendar className="h-3 w-3" />
                          <span className="font-medium">
                            {new Date(event.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          <span className="text-slate-300 dark:text-slate-600">
                            •
                          </span>
                          <span
                            className={`font-medium px-1.5 py-0.5 rounded text-xs ${
                              new Date(event.date) > new Date()
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                            }`}
                          >
                            {new Date(event.date) > new Date()
                              ? "Scheduled"
                              : "Completed"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {internalSelectedEvent && chartData.length > 0 && (
              <div className="flex items-center gap-2">
                <Select
                  value={chartType}
                  onValueChange={(value: "bar" | "pie") => setChartType(value)}
                >
                  <SelectTrigger className="flex-1 min-w-0 h-12 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-2 border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 focus:border-slate-400 dark:focus:border-slate-500 transition-all duration-300 shadow-md hover:shadow-lg rounded-lg font-medium text-sm px-4 py-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/98 dark:bg-gray-900/98 backdrop-blur-md border-2 border-slate-200/80 dark:border-slate-700/80 shadow-xl rounded-lg">
                    <SelectItem
                      value="bar"
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-all duration-200 p-3 cursor-pointer rounded-md mx-1 my-1 font-medium"
                    >
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                        <span className="text-sm">Bar Chart</span>
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="pie"
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-all duration-200 p-3 cursor-pointer rounded-md mx-1 my-1 font-medium"
                    >
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                        <span className="text-sm">Pie Chart</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading || isFetchingEventData ? (
            <div className="h-64 sm:h-72 lg:h-80 flex items-center justify-center">
              <div className="space-y-4 w-full">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
          ) : internalSelectedEvent && chartData.length > 0 ? (
            <div className="h-64 sm:h-72 lg:h-80">
              {chartType === "bar" ? (
                /* Bar Chart for Single Event */
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="opacity-30"
                    />
                    <XAxis
                      dataKey="displayName"
                      axisLine={{
                        stroke: chartColors.borderColor,
                        strokeWidth: 1.5,
                      }}
                      tickLine={{
                        stroke: chartColors.borderColor,
                        strokeWidth: 1.5,
                      }}
                      tick={{
                        fontSize: 13,
                        fill: chartColors.textColor,
                        fontWeight: 500,
                        fontFamily: "Inter, system-ui, sans-serif",
                      }}
                    />
                    <YAxis
                      axisLine={{
                        stroke: chartColors.borderColor,
                        strokeWidth: 1.5,
                      }}
                      tickLine={{
                        stroke: chartColors.borderColor,
                        strokeWidth: 1.5,
                      }}
                      tick={{
                        fontSize: 13,
                        fill: chartColors.textColor,
                        fontWeight: 500,
                        fontFamily: "Inter, system-ui, sans-serif",
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{
                        paddingTop: "20px",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Bar
                      dataKey="Present"
                      fill="hsl(142 76% 36%)"
                      radius={[4, 4, 0, 0]}
                      name="Present"
                    />
                    <Bar
                      dataKey="Absent"
                      fill="hsl(0 84% 60%)"
                      radius={[4, 4, 0, 0]}
                      name="Absent"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                /* Pie Chart for Single Event */
                // <ResponsiveContainer width="100%" height="100%">
                //   <PieChart>
                //     <Pie
                //       data={[
                //         { name: "Present", value: chartData[0].Present },
                //         { name: "Absent", value: chartData[0].Absent },
                //       ]}
                //       cx="50%"
                //       cy="50%"
                //       innerRadius={45}
                //       outerRadius={60}
                //       paddingAngle={3}
                //       dataKey="value"
                //       animationBegin={0}
                //       animationDuration={1200}
                //       animationEasing="ease-out"
                //     >
                //       {chartData.map((entry, index) => (
                //         <Cell
                //           key={`cell-${index}`}
                //           fill={COLORS[index % COLORS.length]}
                //           stroke="hsl(var(--background))"
                //           strokeWidth={2}
                //         />
                //       ))}
                //     </Pie>
                //     <Tooltip
                //       content={({ active, payload }) => {
                //         if (active && payload && payload.length) {
                //           const data = payload[0];
                //           return (
                //             <div className="rounded-lg border-2 border-border/60 bg-background/95 backdrop-blur-md p-4 shadow-xl">
                //               <div className="flex items-center gap-3">
                //                 <div
                //                   className="w-4 h-4 rounded-full shadow-md border-2 border-white/50"
                //                   style={{
                //                     backgroundColor: data.payload.color,
                //                   }}
                //                 ></div>
                //                 <div>
                //                   <span className="text-sm font-semibold text-foreground">
                //                     {data.name}
                //                   </span>
                //                   <div className="text-lg font-bold text-primary">
                //                     {data.value}
                //                   </div>
                //                 </div>
                //               </div>
                //             </div>
                //           );
                //         }
                //         return null;
                //       }}
                //     />
                //     {/* <Legend
                //       wrapperStyle={{
                //         paddingTop: "20px",
                //         fontSize: "14px",
                //         fontWeight: "500",
                //         color: "hsl(var(--foreground))",
                //       }}
                //     /> */}
                //   </PieChart>
                // </ResponsiveContainer>
                // ... existing imports and component code ...

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-2">
                  {chartData.map((event, index) => {
                    const pieData = [
                      {
                        name: "Present",
                        value: event.Present,
                        color: COLORS.present,
                      },
                      {
                        name: "Absent",
                        value: event.Absent,
                        color: COLORS.absent,
                      },
                    ];

                    return (
                      <div
                        key={index}
                        className="group flex flex-col items-center p-0 rounded-2xl hover:shadow-2xl transition-all duration-500 via-muted/5 to-muted/10"
                      >
                        <div className="text-base font-semibold text-foreground mb-2 text-center leading-tight">
                          {event.displayName}
                        </div>
                        <div className="relative mb-4">
                          <ResponsiveContainer width={140} height={140}>
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={60}
                                paddingAngle={3}
                                dataKey="value"
                                animationBegin={index * 200}
                                animationDuration={1200}
                                animationEasing="ease-out"
                              >
                                {pieData.map((entry, pieIndex) => (
                                  <Cell
                                    key={`cell-${pieIndex}`}
                                    fill={entry.color}
                                    stroke="hsl(var(--background))"
                                    strokeWidth={2}
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0];
                                    return (
                                      <div className="rounded-lg border-2 border-border/60 bg-background/95 backdrop-blur-md p-4 shadow-xl">
                                        <div className="flex items-center gap-3">
                                          <div
                                            className="w-4 h-4 rounded-full shadow-md border-2 border-white/50"
                                            style={{
                                              backgroundColor:
                                                data.payload.color,
                                            }}
                                          ></div>
                                          <div>
                                            <span className="text-sm font-semibold text-foreground">
                                              {data.name}
                                            </span>
                                            <div className="text-lg font-bold text-primary">
                                              {data.value}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          {/* Enhanced center label */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center bg-background/95 backdrop-blur-sm rounded-full px-2 py-1 border border-border/40 shadow-md">
                              <div className="text-xl font-bold text-foreground leading-none">
                                {event.attendanceRate}%
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-xs w-full justify-center">
                          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            <div
                              className="w-3 h-3 rounded-full shadow-sm border border-white"
                              style={{ backgroundColor: COLORS.present }}
                            ></div>
                            <div className="text-center">
                              <span className="text-muted-foreground font-medium block text-[10px] uppercase tracking-wide">
                                Present
                              </span>
                              <span className="text-foreground font-bold text-sm">
                                {event.Present}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/20 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800">
                            <div
                              className="w-3 h-3 rounded-full shadow-sm border border-white"
                              style={{ backgroundColor: COLORS.absent }}
                            ></div>
                            <div className="text-center">
                              <span className="text-muted-foreground font-medium block text-[10px] uppercase tracking-wide">
                                Absent
                              </span>
                              <span className="text-foreground font-bold text-sm">
                                {event.Absent}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="h-64 sm:h-72 lg:h-80 flex items-center justify-center">
              <div className="text-center">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-sm lg:text-base font-medium text-foreground mb-2">
                  {internalSelectedEvent
                    ? "No attendance data available"
                    : "Select an event to view attendance"}
                </h3>
                <p className="text-xs lg:text-sm text-muted-foreground">
                  {internalSelectedEvent
                    ? "No attendance records found for this event."
                    : "Choose an event from the dropdown above to see detailed attendance breakdown."}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
