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
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useMemo, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Percent,
  CalendarDays,
  UserStar,
  EqualApproximately,
  BarChart3,
  Activity,
  Banknote,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { Event } from "../types";
import { ShortcutLinks } from "./ShortcutLinks";
import { useDashboard } from "../hooks/useDashboard";

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const event = payload[0].payload;
    return (
      <div className="rounded-md border border-border bg-card p-3 shadow-md text-sm max-w-xs">
        <p className="font-semibold text-foreground mb-2 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          {label}
        </p>
        <div className="space-y-1.5">
          {payload.map((entry, index) => (
            <div
              key={`item-${index}`}
              className="flex items-center justify-between gap-6"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground">{entry.name}</span>
              </div>
              <span className="font-semibold text-foreground">
                {entry.value}
              </span>
            </div>
          ))}
          {event?.attendanceRate && (
            <div className="pt-2 mt-2 border-t border-border flex items-center justify-between gap-6">
              <span className="text-muted-foreground">Rate</span>
              <span className="font-semibold text-green-600">
                {event.attendanceRate}%
              </span>
            </div>
          )}
          {event?.date && (
            <p className="text-xs text-muted-foreground pt-1">
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

// ─── Props ────────────────────────────────────────────────────────────────────
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
  feesCollected?: number;
  unpaidFinesAmount?: number;
  clearanceRate?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function MembersStats({
  isLoading = false,
  studentStats,
  eventAttendance,
  feesCollected = 0,
  unpaidFinesAmount = 0,
  clearanceRate = 0,
}: MembersStatsProps) {
  // Chart colors derived from CSS variables (client-only)
  const [chartColors, setChartColors] = useState({
    textColor: "#6b7280",
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    foregroundColor: "#000000",
  });

  const {
    upcomingEvents,
    ongoingEvents
  } = useDashboard();

  useEffect(() => {
    const computedStyle = getComputedStyle(document.documentElement);
    setChartColors({
      textColor:
        computedStyle.getPropertyValue("--muted-foreground").trim() ||
        "#6b7280",
      borderColor:
        computedStyle.getPropertyValue("--border").trim() || "#e5e7eb",
      backgroundColor:
        computedStyle.getPropertyValue("--background").trim() || "#ffffff",
      foregroundColor:
        computedStyle.getPropertyValue("--foreground").trim() || "#000000",
    });
  }, []);

  const [filterType, setFilterType] = useState<string>("recent");
  const [chartType, setChartType] = useState<string>("bar");
  const [eventPresentCounts, setEventPresentCounts] = useState<{
    [key: string]: number;
  }>({});

  useEffect(() => {
    const counts: { [key: string]: number } = {};
    for (const event of eventAttendance) {
      counts[event.id] = event.attendees || 0;
    }
    setEventPresentCounts(counts);
    setFilterType("recent");
  }, [eventAttendance]);

  const years = useMemo(() => {
    const uniqueYears = new Set<string>();
    eventAttendance.forEach((event) => {
      uniqueYears.add(new Date(event.date).getFullYear().toString());
    });
    return Array.from(uniqueYears).sort((a, b) => b.localeCompare(a));
  }, [eventAttendance]);

  const chartData = useMemo(() => {
    let filteredEvents = [...eventAttendance];
    if (filterType === "recent") {
      filteredEvents = filteredEvents
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
    } else if (years.includes(filterType)) {
      filteredEvents = filteredEvents.filter(
        (event) => new Date(event.date).getFullYear().toString() === filterType,
      );
    }
    return filteredEvents
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
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
  }, [
    eventAttendance,
    filterType,
    years,
    studentStats.totalStudents,
    eventPresentCounts,
  ]);

  const COLORS = {
    present: "hsl(142 76% 36%)",
    absent: "hsl(0 84% 60%)",
  };

  // ─── Stat card definitions ─────────────────────────────────────────────────
  const clearedStudents = Math.round(
    clearanceRate * studentStats.totalStudents,
  );
  const unclearedStudents = studentStats.totalStudents - clearedStudents;

  const statCards = [
    {
      title: "Total Students",
      value: studentStats.totalStudents.toLocaleString(),
      description: `${studentStats.totalEvents} event${studentStats.totalEvents !== 1 ? "s" : ""} this semester`,
      icon: Users,
      isComingSoon: false,
    },
    {
      title: "Fees Collected",
      // value: `₱${feesCollected.toLocaleString()}`,
      value: "Coming Soon",
      description: "Total fees paid this semester",
      icon: Banknote,
      isComingSoon: true,
    },
    {
      title: "Unpaid Fines",
      // value: `₱${unpaidFinesAmount.toLocaleString()}`,
      value: "Coming Soon",
      description: "Outstanding fines balance",
      icon: AlertTriangle,
      isComingSoon: true,
    },
    {
      title: "Clearance Rate",
      // value: `${(clearanceRate * 100).toFixed(1)}%`,
      value: "Coming Soon",
      // description: `${clearedStudents} cleared · ${unclearedStudents} uncleared`,
      description: `Percentage of students cleared`,
      icon: ShieldCheck,
      isComingSoon: true,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4 lg:gap-4">
        {statCards.map(
          ({ title, value, description, icon: Icon, isComingSoon }) => (
            <Card
              key={title}
              className={`border-border bg-card ${isComingSoon ? "opacity-60" : ""}`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4 sm:px-6 sm:pt-5">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                  {title}
                </CardTitle>
                <Icon className="size-4 text-primary" />
              </CardHeader>
              <CardContent className="px-4 pb-4 sm:px-6 sm:pb-5">
                {isLoading ? (
                  <>
                    <Skeleton className="h-8 w-24 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </>
                ) : (
                  <>
                    <p
                      className={`text-2xl font-bold ${isComingSoon ? "text-muted-foreground/50 text-lg italic" : "text-foreground"}`}
                    >
                      {value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {description}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          ),
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* ── Chart Card ── */}
        <Card className="lg:col-span-3 border-border bg-card gap-0">
          <CardHeader className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                  <Activity className="size-4 text-primary" />
                  Attendance by Event
                </CardTitle>
                <CardDescription className="text-muted-foreground mt-1">
                  Comprehensive event attendance overview
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={chartType} onValueChange={setChartType}>
                  <SelectTrigger className="w-full sm:w-[140px] h-8 text-xs border-border">
                    <SelectValue placeholder="Chart type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">
                      <div className="flex items-center gap-2 text-xs">
                        <BarChart3 className="h-3.5 w-3.5" />
                        Bar Chart
                      </div>
                    </SelectItem>
                    <SelectItem value="pie">
                      <div className="flex items-center gap-2 text-xs">
                        <Activity className="h-3.5 w-3.5" />
                        Pie Charts
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-[140px] h-8 text-xs border-border">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">
                      <span className="text-xs">Recent Events</span>
                    </SelectItem>
                    <SelectItem value="all">
                      <span className="text-xs">All Events</span>
                    </SelectItem>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        <span className="text-xs">{year}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            {/* Chart */}
            {isLoading ? (
              <div className="h-72 flex items-center justify-center rounded-md border border-border bg-muted/20">
                <div className="space-y-3 w-full px-6">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-4/5" />
                  <Skeleton className="h-6 w-3/5" />
                  <Skeleton className="h-6 w-2/5" />
                </div>
              </div>
            ) : chartType === "pie" ? (
              /* ── Pie charts grid ── */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
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
                      className="flex flex-col items-center rounded-md border border-border p-4"
                    >
                      <p className="text-sm font-medium text-foreground mb-3">
                        {event.displayName}
                      </p>
                      <div className="relative">
                        <ResponsiveContainer width={130} height={130}>
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={42}
                              outerRadius={58}
                              paddingAngle={3}
                              dataKey="value"
                              animationBegin={index * 200}
                              animationDuration={1000}
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
                                    <div className="rounded-md border border-border bg-card p-2 shadow-md text-sm">
                                      <div className="flex items-center gap-2">
                                        <div
                                          className="w-2.5 h-2.5 rounded-full"
                                          style={{
                                            backgroundColor: data.payload.color,
                                          }}
                                        />
                                        <span className="text-muted-foreground">
                                          {data.name}
                                        </span>
                                        <span className="font-semibold text-foreground">
                                          {data.value}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-base font-bold text-foreground">
                            {event.attendanceRate}%
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-4 mt-3 text-xs">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: COLORS.present }}
                          />
                          <span className="text-muted-foreground">Present</span>
                          <span className="font-semibold text-foreground">
                            {event.Present}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: COLORS.absent }}
                          />
                          <span className="text-muted-foreground">Absent</span>
                          <span className="font-semibold text-foreground">
                            {event.Absent}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ── Bar chart ── */
              /* inline style height is required — Tailwind h-* classes alone can cause
               ResponsiveContainer to measure 0px during SSR/hydration in Next.js     */
              <div style={{ width: "100%", height: 288 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 6"
                      stroke={chartColors.borderColor}
                      opacity={0.5}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="displayName"
                      tick={{
                        fontSize: 12,
                        fill: chartColors.textColor,
                        fontWeight: 500,
                      }}
                      axisLine={{ stroke: chartColors.borderColor }}
                      tickLine={false}
                      dy={8}
                      interval={0}
                    />
                    <YAxis
                      tick={{
                        fontSize: 12,
                        fill: chartColors.textColor,
                        fontWeight: 500,
                      }}
                      axisLine={false}
                      tickLine={false}
                      dx={-4}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{
                        paddingTop: "16px",
                        fontSize: "13px",
                        fontWeight: 500,
                        color: chartColors.foregroundColor,
                      }}
                      iconSize={10}
                      iconType="circle"
                    />
                    <Bar
                      dataKey="Present"
                      fill={COLORS.present}
                      name="Present"
                      radius={[4, 4, 0, 0]}
                      animationDuration={1200}
                    />
                    <Bar
                      dataKey="Absent"
                      fill={COLORS.absent}
                      name="Absent"
                      radius={[4, 4, 0, 0]}
                      animationDuration={1200}
                      animationBegin={300}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Key stats footer */}
            {!isLoading && (
              <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 divide-x divide-border sm:grid-cols-3">
                <div className="flex flex-col items-center gap-1 px-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <UserStar className="h-3.5 w-3.5" />
                    <span>Peak</span>
                  </div>
                  <span className="text-lg font-bold text-foreground">
                    {studentStats.peakAttendance.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1 px-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Percent className="h-3.5 w-3.5" />
                    <span>Overall Rate</span>
                  </div>
                  <span className="text-lg font-bold text-foreground">
                    {studentStats.overallAttendanceRate}%
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1 px-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <EqualApproximately className="h-3.5 w-3.5" />
                    <span>Average</span>
                  </div>
                  <span className="text-lg font-bold text-foreground">
                    {studentStats.averageAttendance.toFixed(1)}
                  </span>
                </div>
              </div>
            )}

            {/* Event legend */}
            {!isLoading && chartData.length > 1 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Event Legend
                </p>
                <div className="flex flex-wrap gap-2">
                  {chartData.map((event, index) => {
                    const colors = [
                      "hsl(142 76% 36%)",
                      "hsl(221 83% 53%)",
                      "hsl(262 83% 58%)",
                      "hsl(17 87% 59%)",
                      "hsl(142 69% 58%)",
                      "hsl(199 89% 48%)",
                      "hsl(280 87% 65%)",
                      "hsl(25 95% 53%)",
                    ];
                    const color = colors[index % colors.length];
                    const isLong = event.name.length > 20;

                    return (
                      <div
                        key={index}
                        className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs"
                      >
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-semibold text-foreground">
                          {event.displayName}
                        </span>
                        {isLong ? (
                          <TooltipProvider>
                            <UITooltip>
                              <TooltipTrigger asChild>
                                <span className="text-muted-foreground truncate max-w-[120px] cursor-help">
                                  {event.name}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{event.name}</p>
                              </TooltipContent>
                            </UITooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-muted-foreground">
                            {event.name}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  {chartData.length} event{chartData.length !== 1 ? "s" : ""} ·{" "}
                  {chartData.reduce((sum, e) => sum + (e.Present || 0), 0)}{" "}
                  total attendees
                </p>
              </div>
            )}

            {/* Loading legend skeleton */}
            {isLoading && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-7 w-32 rounded-md" />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        {/*quick access to events*/}
        <ShortcutLinks
          upcomingEvents={upcomingEvents}
          ongoingEvents={ongoingEvents}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
