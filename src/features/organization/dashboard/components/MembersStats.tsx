"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  TooltipProps,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useMemo, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  Percent,
  CalendarDays,
  UsersRound,
  UserStar,
  EqualApproximately,
  BarChart3,
  Activity,
  UserX,
} from "lucide-react";
import { Event } from "../types";
import { getEventById } from "@/firebase";
const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const event = payload[0].payload;

    return (
      <div className="rounded-xl border border-border/80 bg-background/98 backdrop-blur-md p-4 shadow-xl max-w-xs">
        <p className="font-bold text-base mb-4 text-foreground flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-primary" />
          {label}
        </p>
        <div className="space-y-3">
          {payload.map((entry, index) => (
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
          ))}
          {event && event.attendanceRate && (
            <div className="pt-3 mt-3 border-t border-border/50">
              <div className="flex items-center gap-4 p-2 rounded-lg bg-primary/5 border border-primary/20">
                <div className="w-4 h-4 rounded-full bg-green-500 shadow-sm"></div>
                <div className="flex-1 flex justify-between items-center">
                  <span className="text-sm font-semibold text-foreground">
                    Attendance Rate:
                  </span>
                  <span className="text-base font-bold text-green-600">
                    {event.attendanceRate}%
                  </span>
                </div>
              </div>
            </div>
          )}
          {event && event.date && (
            <p className="text-xs text-muted-foreground flex items-center gap-2 pt-2 font-medium">
              <CalendarDays className="h-4 w-4" />
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
}

export function MembersStats({
  isLoading = false,
  studentStats,
  eventAttendance,
}: MembersStatsProps) {
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

  // Filter options
  const [filterType, setFilterType] = useState<string>("recent");
  const [chartType, setChartType] = useState<string>("bar");
  const [eventPresentCounts, setEventPresentCounts] = useState<{
    [key: string]: number;
  }>({});

  useEffect(() => {
    const fetchEventPresentCounts = async () => {
      const counts: { [key: string]: number } = {};
      for (const event of eventAttendance) {
        // Changed this to just use the attendees count from the event data
        counts[event.id] = event.attendees || 0;
      }
      setEventPresentCounts(counts);
    };
    setFilterType("recent"); // Reset filter to recent on data change

    fetchEventPresentCounts();
  }, [eventAttendance]);

  // Get years from event data for filter options
  const years = useMemo(() => {
    const uniqueYears = new Set<string>();
    eventAttendance.forEach((event) => {
      const year = new Date(event.date).getFullYear().toString();
      uniqueYears.add(year);
    });
    return Array.from(uniqueYears).sort((a, b) => b.localeCompare(a)); // Sort descending
  }, [eventAttendance]);

  // Filter and prepare chart data based on selected filter
  const chartData = useMemo(() => {
    let filteredEvents = [...eventAttendance];

    if (filterType === "recent") {
      // Show the most recent 5 events
      filteredEvents = filteredEvents
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
    } else if (years.includes(filterType)) {
      // Filter by selected year
      filteredEvents = filteredEvents.filter(
        (event) => new Date(event.date).getFullYear().toString() === filterType
      );
    }

    // Prepare chart data from filtered events
    return filteredEvents
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Sort by date ascending
      .map((event, index) => {
        const totalMembers = studentStats.totalStudents;
        const presentCount = eventPresentCounts[event.id] || 0;
        const absent = totalMembers - presentCount;
        return {
          name: event.name,
          displayName: `Event ${index + 1}`,
          Present: presentCount,
          Absent: absent > 0 ? absent : 0,
          date: event.date,
          attendanceRate: presentCount
            ? ((presentCount / totalMembers) * 100).toFixed(1)
            : 0,
        };
      });
  }, [eventAttendance, filterType, years, studentStats.totalStudents]);

  // Render different chart types
  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: {
        top: 40,
        right: 50,
        left: 40,
        bottom: 40,
      },
    };

    switch (chartType) {
      case "pie":
        // Enhanced color palette for pie charts
        const COLORS = {
          present: "hsl(142 76% 36%)", // Emerald green
          absent: "hsl(0 84% 60%)", // Red
        };

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {chartData.map((event, index) => {
              const pieData = [
                {
                  name: "Present",
                  value: event.Present,
                  color: COLORS.present,
                },
                { name: "Absent", value: event.Absent, color: COLORS.absent },
              ];

              return (
                <div
                  key={index}
                  className="group flex flex-col items-center p-6 rounded-2xl border-2 border-border/30 hover:border-primary/40 hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-background via-muted/5 to-muted/10 backdrop-blur-sm"
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
                                        backgroundColor: data.payload.color,
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
        );

      default:
        return (
          <BarChart {...commonProps}>
            <CartesianGrid
              strokeDasharray="3 6"
              stroke={chartColors.borderColor}
              opacity={0.6}
              vertical={false}
              strokeWidth={1.5}
            />
            <XAxis
              dataKey="displayName"
              tick={{
                fontSize: 13,
                fill: chartColors.textColor,
                fontWeight: 500,
                fontFamily: "Inter, system-ui, sans-serif",
              }}
              axisLine={{ stroke: chartColors.borderColor, strokeWidth: 1.5 }}
              tickLine={{ stroke: chartColors.borderColor, strokeWidth: 1.5 }}
              dy={10}
              interval={0}
            />
            <YAxis
              tick={{
                fontSize: 13,
                fill: chartColors.textColor,
                fontWeight: 500,
                fontFamily: "Inter, system-ui, sans-serif",
              }}
              axisLine={{ stroke: chartColors.borderColor, strokeWidth: 1.5 }}
              tickLine={{ stroke: chartColors.borderColor, strokeWidth: 1.5 }}
              dx={-8}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                paddingTop: "24px",
                fontSize: "14px",
                fontWeight: 500,
                fontFamily: "Inter, system-ui, sans-serif",
                color: chartColors.foregroundColor,
              }}
              iconSize={12}
              iconType="circle"
              formatter={(value, entry) => (
                <span
                  style={{
                    color: entry.color,
                    fontWeight: 600,
                    fontSize: "13px",
                    letterSpacing: "0.025em",
                  }}
                >
                  {value}
                </span>
              )}
            />
            <Bar
              dataKey="Present"
              fill="hsl(142 76% 36%)"
              name="Present"
              radius={[8, 8, 0, 0]}
              animationBegin={0}
              animationDuration={1500}
              animationEasing="ease-out"
              stroke={chartColors.backgroundColor}
              strokeWidth={2}
            />
            <Bar
              dataKey="Absent"
              fill="hsl(0 84% 60%)"
              name="Absent"
              radius={[8, 8, 0, 0]}
              animationBegin={400}
              animationDuration={1500}
              animationEasing="ease-out"
              stroke={chartColors.backgroundColor}
              strokeWidth={2}
            />
          </BarChart>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up animation-delay-200">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Students - Featured Card */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-50 via-blue-100/80 to-indigo-100 dark:from-blue-950/90 dark:via-blue-900/80 dark:to-indigo-950/90 border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] backdrop-blur-sm animate-fade-in-up animation-delay-400">
          {/* Animated background elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-300/15 to-indigo-400/15 rounded-full -ml-12 -mb-12 group-hover:scale-110 transition-transform duration-700 delay-100"></div>

          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="relative p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 text-blue-600 dark:text-blue-300 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <User className="h-8 w-8 drop-shadow-sm" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-blue-900 dark:text-blue-100 leading-tight tracking-tight">
                  Total Students
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 relative z-10">
            {isLoading ? (
              <Skeleton className="h-12 w-32 rounded-lg" />
            ) : (
              <div className="text-4xl font-black text-blue-900 dark:text-blue-100 leading-none tracking-tight group-hover:scale-105 transition-transform duration-300">
                {studentStats.totalStudents.toLocaleString()}
              </div>
            )}
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1 w-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
            </div>
          </CardContent>
        </Card>

        {/* Total Events */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 via-emerald-100/80 to-teal-100 dark:from-emerald-950/90 dark:via-emerald-900/80 dark:to-teal-950/90 border-0 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02] backdrop-blur-sm animate-fade-in-up animation-delay-600">
          {/* Animated background elements */}
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-emerald-400/20 to-teal-500/20 rounded-full -mr-14 -mt-14 group-hover:scale-110 transition-transform duration-700"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-emerald-300/15 to-teal-400/15 rounded-full -ml-10 -mb-10 group-hover:scale-110 transition-transform duration-700 delay-100"></div>

          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="relative p-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 text-emerald-600 dark:text-emerald-300 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <CalendarDays className="h-7 w-7 drop-shadow-sm" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-emerald-900 dark:text-emerald-100 leading-tight tracking-tight">
                  Total Events
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 relative z-10">
            {isLoading ? (
              <Skeleton className="h-11 w-24 rounded-lg" />
            ) : (
              <div className="text-4xl font-black text-emerald-900 dark:text-emerald-100 leading-none tracking-tight group-hover:scale-105 transition-transform duration-300">
                {studentStats.totalEvents.toLocaleString()}
              </div>
            )}
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1 w-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
            </div>
          </CardContent>
        </Card>

        {/* Total Attendances */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-50 via-purple-100/80 to-violet-100 dark:from-purple-950/90 dark:via-purple-900/80 dark:to-violet-950/90 border-0 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02] backdrop-blur-sm animate-fade-in-up animation-delay-800">
          {/* Animated background elements */}
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-purple-400/20 to-violet-500/20 rounded-full -mr-14 -mt-14 group-hover:scale-110 transition-transform duration-700"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-purple-300/15 to-violet-400/15 rounded-full -ml-10 -mb-10 group-hover:scale-110 transition-transform duration-700 delay-100"></div>

          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="relative p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-violet-600/20 text-purple-600 dark:text-purple-300 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <UsersRound className="h-7 w-7 drop-shadow-sm" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-400/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-purple-900 dark:text-purple-100 leading-tight tracking-tight">
                  Total Attendances
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 relative z-10">
            {isLoading ? (
              <Skeleton className="h-11 w-28 rounded-lg" />
            ) : (
              <div className="text-4xl font-black text-purple-900 dark:text-purple-100 leading-none tracking-tight group-hover:scale-105 transition-transform duration-300">
                {studentStats.totalAttendances.toLocaleString()}
              </div>
            )}
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1 w-8 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full"></div>
            </div>
          </CardContent>
        </Card>

        {/* Total Absences */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-red-50 via-orange-100/80 to-red-100 dark:from-red-950/90 dark:via-orange-900/80 dark:to-red-950/90 border-0 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02] backdrop-blur-sm animate-fade-in-up animation-delay-1000">
          {/* Animated background elements */}
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-red-400/20 to-orange-500/20 rounded-full -mr-14 -mt-14 group-hover:scale-110 transition-transform duration-700"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-red-300/15 to-orange-400/15 rounded-full -ml-10 -mb-10 group-hover:scale-110 transition-transform duration-700 delay-100"></div>

          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="relative p-4 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-600/20 text-red-600 dark:text-red-300 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <UserX className="h-7 w-7 drop-shadow-sm" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-400/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-red-900 dark:text-red-100 leading-tight tracking-tight">
                  Total Absences
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 relative z-10">
            {isLoading ? (
              <Skeleton className="h-11 w-24 rounded-lg" />
            ) : (
              <div className="text-4xl font-black text-red-900 dark:text-red-100 leading-none tracking-tight group-hover:scale-105 transition-transform duration-300">
                {studentStats.totalAbsences.toLocaleString()}
              </div>
            )}
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1 w-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-full"></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="group relative overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500 border-0 bg-gradient-to-br from-background via-background/95 to-muted/30 backdrop-blur-xl animate-fade-in-up animation-delay-1200">
        {/* Subtle animated background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-50"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-full -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-1000"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-primary/5 to-transparent rounded-full -ml-24 -mb-24 group-hover:scale-110 transition-transform duration-1000 delay-200"></div>

        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 pb-0 px-10 relative z-10">
          <div className="flex flex-col gap-2">
            <CardTitle className="text-3xl font-black text-foreground flex items-center gap-4 tracking-tight">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary shadow-lg">
                <Activity className="h-8 w-8" />
              </div>
              Attendance by Event
            </CardTitle>
            <span className="text-base text-muted-foreground font-semibold pl-16 tracking-wide">
              Comprehensive event attendance overview and insights
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 relative z-10">
            {/* Chart Type Selector */}
            <Select
              value={chartType}
              onValueChange={(value) => setChartType(value)}
            >
              <SelectTrigger className="w-full sm:w-[180px] h-12 border-2 border-border/50 hover:border-primary/60 transition-all duration-300 bg-background/80 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-105">
                <SelectValue placeholder="Chart type" />
              </SelectTrigger>
              <SelectContent className="border-2 border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl">
                <SelectItem
                  value="bar"
                  className="cursor-pointer hover:bg-primary/10 transition-colors duration-200"
                >
                  <div className="flex items-center gap-3 py-1">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Bar Chart</span>
                  </div>
                </SelectItem>
                <SelectItem
                  value="pie"
                  className="cursor-pointer hover:bg-primary/10 transition-colors duration-200"
                >
                  <div className="flex items-center gap-3 py-1">
                    <Activity className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Pie Charts</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Time Filter Selector */}
            <Select
              value={filterType}
              onValueChange={(value) => setFilterType(value)}
            >
              <SelectTrigger className="w-full sm:w-[180px] h-12 border-2 border-border/50 hover:border-primary/60 transition-all duration-300 bg-background/80 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-105">
                <SelectValue placeholder="Filter events" />
              </SelectTrigger>
              <SelectContent className="border-2 border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl">
                <SelectItem
                  value="recent"
                  className="cursor-pointer hover:bg-primary/10 transition-colors duration-200"
                >
                  <span className="font-semibold">Recent Events</span>
                </SelectItem>
                <SelectItem
                  value="all"
                  className="cursor-pointer hover:bg-primary/10 transition-colors duration-200"
                >
                  <span className="font-semibold">All Events</span>
                </SelectItem>
                {years.map((year) => (
                  <SelectItem
                    key={year}
                    value={year}
                    className="cursor-pointer hover:bg-primary/10 transition-colors duration-200"
                  >
                    <span className="font-semibold">{year}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div
            className={`px-8 ${
              chartType === "pie" ? "h-auto min-h-[320px]" : "h-[480px]"
            } pb-4`}
          >
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/20 to-muted/10 rounded-xl border border-border/30">
                <div className="space-y-6 w-full px-8 py-8">
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-full rounded-lg" />
                    <Skeleton className="h-6 w-3/4 rounded-lg" />
                    <Skeleton className="h-4 w-1/2 rounded-lg" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-20 w-full rounded-lg" />
                    <Skeleton className="h-20 w-full rounded-lg" />
                    <Skeleton className="h-20 w-full rounded-lg" />
                  </div>
                  <Skeleton className="h-4 w-full rounded-lg" />
                </div>
              </div>
            ) : chartType === "pie" ? (
              renderChart()
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {renderChart()}
              </ResponsiveContainer>
            )}
          </div>

          {/* Key Statistics - Elegant Horizontal Layout */}
          <div className="px-8 mt-6 animate-fade-in-up animation-delay-1400">
            <div className="bg-gradient-to-r from-background via-muted/30 to-background border border-border/50 rounded-2xl p-6 shadow-sm backdrop-blur-sm">
              <div className="flex items-center justify-between gap-8">
                {/* Peak Attendance */}
                <div className="flex-1 text-center group">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="p-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500/20 transition-colors duration-200">
                      <UserStar className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Peak
                    </span>
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-7 w-12 mx-auto" />
                  ) : (
                    <div className="text-2xl font-bold text-amber-700 dark:text-amber-300 leading-none">
                      {studentStats.peakAttendance.toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="w-px h-12 bg-border/50"></div>

                {/* Overall Attendance Rate */}
                <div className="flex-1 text-center group">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="p-1.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 group-hover:bg-green-500/20 transition-colors duration-200">
                      <Percent className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Rate
                    </span>
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-7 w-10 mx-auto" />
                  ) : (
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300 leading-none">
                      {studentStats.overallAttendanceRate}%
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="w-px h-12 bg-border/50"></div>

                {/* Average Attendance */}
                <div className="flex-1 text-center group">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="p-1.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-500/20 transition-colors duration-200">
                      <EqualApproximately className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Average
                    </span>
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-7 w-10 mx-auto" />
                  ) : (
                    <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 leading-none">
                      {studentStats.averageAttendance.toFixed(1)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Event Legend */}
          {!isLoading && chartData.length > 1 && (
            <div className="px-8 mt-6 animate-fade-in-up animation-delay-1600">
              <div className="bg-gradient-to-r from-background via-muted/20 to-background border border-border/40 rounded-2xl p-5 shadow-sm backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground uppercase tracking-wider">
                    Event Legend
                  </span>
                </div>

                {/* Horizontal Legend Layout with Flex Fill */}
                <div className="flex flex-wrap gap-3">
                  {chartData.map((event, index) => {
                    // Generate unique colors for each event
                    const colors = [
                      "hsl(142 76% 36%)", // Emerald
                      "hsl(221 83% 53%)", // Blue
                      "hsl(262 83% 58%)", // Purple
                      "hsl(17 87% 59%)", // Orange
                      "hsl(142 69% 58%)", // Green
                      "hsl(199 89% 48%)", // Cyan
                      "hsl(280 87% 65%)", // Violet
                      "hsl(25 95% 53%)", // Amber
                    ];
                    const eventColor = colors[index % colors.length];
                    const isLongName = event.name.length > 20;

                    return (
                      <div
                        key={index}
                        className="flex-1 min-w-0 group flex items-center gap-3 px-4 py-2.5 rounded-xl bg-background/80 border border-border/30 hover:border-primary/30 hover:bg-background/90 transition-all duration-200 hover:shadow-sm cursor-pointer"
                      >
                        {/* Color Indicator */}
                        <div
                          className="w-3 h-3 rounded-full shadow-sm border border-white/50 group-hover:scale-110 transition-transform duration-200 flex-shrink-0"
                          style={{ backgroundColor: eventColor }}
                        ></div>

                        {/* Event Info with Tooltip for Long Names */}
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-semibold text-foreground text-sm leading-tight transition-colors duration-200 truncate">
                            {event.displayName}
                          </span>
                          {isLongName ? (
                            <TooltipProvider>
                              <UITooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-muted-foreground text-xs truncate font-medium leading-tight cursor-help">
                                    {event.name}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">{event.name}</p>
                                </TooltipContent>
                              </UITooltip>
                            </TooltipProvider>
                          ) : (
                            <span className="text-muted-foreground text-xs truncate font-medium leading-tight">
                              {event.name}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Legend Summary */}
                <div className="mt-4 pt-4 border-t border-border/30">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium">
                      {chartData.length} event
                      {chartData.length !== 1 ? "s" : ""}
                    </span>
                    <span className="font-medium">
                      Total:{" "}
                      {chartData.reduce(
                        (sum, event) => sum + (event.Present || 0),
                        0
                      )}{" "}
                      attendees
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="mt-6 border border-border/40 rounded-2xl p-6 bg-gradient-to-br from-muted/20 to-muted/5 shadow-sm backdrop-blur-sm">
              <Skeleton className="h-4 w-32 mb-5" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="flex gap-3 items-center p-3 rounded-xl bg-background/60 border border-border/20"
                  >
                    <Skeleton className="w-2 h-2 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-2 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
