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
  Users,
  Calendar,
  Banknote,
  AlertTriangle,
  ShieldCheck,
  BarChart3,
  Activity,
} from "lucide-react";
import { Event } from "../types";
import { useEffect, useState } from "react";
import { getEventById } from "@/firebase";
import { StatCardsCarousel } from "@/components/organization/general/StatCardsCarousel";
import { StatCard } from "@/components/organization/general/StatCard";

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
  feesCollected?: number;
  unpaidFinesAmount?: number;
  clearanceRate?: number;
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
      <div className="rounded-md border border-border bg-card p-3 shadow-md text-sm max-w-xs">
        <p className="font-semibold text-foreground mb-2 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          {label}
        </p>
        <div className="space-y-1.5">
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-muted-foreground">{entry.name}</span>
              </div>
              <span className="font-semibold text-foreground">{entry.value}</span>
            </div>
          ))}
          {event?.attendanceRate && (
            <div className="pt-2 mt-2 border-t border-border flex items-center justify-between gap-6">
              <span className="text-muted-foreground">Rate</span>
              <span className="font-semibold text-green-600">{event.attendanceRate}%</span>
            </div>
          )}
          {event?.date && (
            <p className="text-xs text-muted-foreground pt-1">
              {new Date(event.date).toLocaleDateString("en-US", {
                weekday: "short", month: "short", day: "numeric", year: "numeric",
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
  feesCollected = 0,
  unpaidFinesAmount = 0,
  clearanceRate = 0,
}: MembersStatsProps) {
  const [internalSelectedEvent, setInternalSelectedEvent] = useState<Event | null>(selectedEvent);
  const [selectedEventPresentCount, setSelectedEventPresentCount] = useState<number | null>(null);
  const [isFetchingEventData, setIsFetchingEventData] = useState(false);
  const [chartType, setChartType] = useState<"bar" | "pie">("pie");

  const [chartColors, setChartColors] = useState({
    textColor: "#6b7280",
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    foregroundColor: "#000000",
  });

  useEffect(() => {
    const computedStyle = getComputedStyle(document.documentElement);
    setChartColors({
      textColor: computedStyle.getPropertyValue("--muted-foreground").trim() || "#6b7280",
      borderColor: computedStyle.getPropertyValue("--border").trim() || "#e5e7eb",
      backgroundColor: computedStyle.getPropertyValue("--background").trim() || "#ffffff",
      foregroundColor: computedStyle.getPropertyValue("--foreground").trim() || "#000000",
    });
  }, []);

  useEffect(() => {
    const fetchSelectedEventData = async () => {
      if (!internalSelectedEvent) {
        setSelectedEventPresentCount(null);
        return;
      }
      setIsFetchingEventData(true);
      try {
        const count =
          ((await getEventById(internalSelectedEvent.id)) as unknown as Event).attendees || 0;
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
    if (!internalSelectedEvent || selectedEventPresentCount === null) return [];
    const totalMembers = studentStats.totalStudents;
    const presentCount = selectedEventPresentCount;
    const absent = totalMembers - presentCount;
    return [
      {
        name: internalSelectedEvent.name.length > 20
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
    present: "hsl(142 76% 36%)",
    absent: "hsl(0 84% 60%)",
  };

  // ── Stat cards — matches desktop layout ────────────────────────────────────
  const clearedStudents = Math.round(clearanceRate * studentStats.totalStudents);
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
      value: `₱${feesCollected.toLocaleString()}`,
      // value: "Coming Soon",
      description: "Total fees paid this semester",
      icon: Banknote,
      isComingSoon: false,
    },
    {
      title: "Unpaid Fines",
      value: `₱${unpaidFinesAmount.toLocaleString()}`,
      // value: "Coming Soon",
      description: "Outstanding fines balance",
      icon: AlertTriangle,
      isComingSoon: false,
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
      {/* ── Stat Grid ── */}
      <StatCardsCarousel className="grid-cols-4">
              <StatCard
                key="total-students"
                title="Total Students"
                value={studentStats.totalStudents.toLocaleString()}
                description={`${studentStats.totalEvents} event${studentStats.totalEvents !== 1 ? "s" : ""} this semester`}
                icon={Users}
                isLoading={isLoading}
                variant="info"
                className={statCards[0].isComingSoon ? "opacity-60 cursor-not-allowed" : ""}
              />
              <StatCard
                key="fees-collected"
                title="Fees Collected"
                value={`₱${feesCollected.toLocaleString()}`}
                description="Total fees paid this semester"
                icon={Banknote}
                isLoading={isLoading}
                variant="success"
                className={statCards[1].isComingSoon ? "opacity-60 cursor-not-allowed" : ""}
              />
              <StatCard
                key="unpaid-fines"
                title="Unpaid Fines"
                value={`₱${unpaidFinesAmount.toLocaleString()}`}
                description="Outstanding fines balance"
                icon={AlertTriangle}
                isLoading={isLoading}
                variant="danger"
                className={statCards[2].isComingSoon ? "opacity-60 cursor-not-allowed" : ""}
              />
              <StatCard
                key="clearance-rate"
                title="Clearance Rate"
                value="Coming Soon"
                description="Percentage of students cleared"
                icon={ShieldCheck}
                isLoading={isLoading}
                variant="neutral"
                className="opacity-60 cursor-not-allowed"
              />
            </StatCardsCarousel>

      {/* ── Chart Card ── */}
      <Card className="border-border bg-card gap-0">
        <CardHeader className="px-4 pt-4 pb-3">
          <div className="flex flex-col gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                <Activity className="size-4 text-primary" />
                {internalSelectedEvent ? `${internalSelectedEvent.name} Attendance` : "Attendance Overview"}
              </CardTitle>
              <CardDescription className="mt-1 text-muted-foreground">
                {internalSelectedEvent
                  ? "Detailed attendance breakdown for this event"
                  : "Select an event above to view detailed attendance"}
              </CardDescription>
            </div>

            {/* Event select */}
            <Select
              value={internalSelectedEvent?.id || ""}
              onValueChange={(value) => {
                const event = eventAttendance.find((e) => e.id === value);
                setInternalSelectedEvent(event || null);
              }}
            >
              <SelectTrigger className="w-full h-9 text-xs border-border py-1">
                <SelectValue placeholder="Select event for analysis" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {Array.from(new Map(eventAttendance.map((e) => [e.id, e])).values()).map(
                  (event, index) => (
                    <SelectItem key={event.id} value={event.id} className="text-xs">
                      <div className="flex flex-col gap-0.5 text-left py-1">
                        <span className="font-medium text-foreground">
                          {String(index + 1).padStart(2, "0")}. {event.name}
                        </span>
                        <span className="text-muted-foreground">
                          {new Date(event.date).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                          })}
                          {" · "}
                          {new Date(event.date) > new Date() ? "Scheduled" : "Completed"}
                        </span>
                      </div>
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>

            {/* Chart type select — only shown when event is selected and has data */}
            {internalSelectedEvent && chartData.length > 0 && (
              <Select
                value={chartType}
                onValueChange={(value: "bar" | "pie") => setChartType(value)}
              >
                <SelectTrigger className="w-full h-9 text-xs border-border">
                  <SelectValue />
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
                      Pie Chart
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4">
          {isLoading || isFetchingEventData ? (
            <div className="h-56 flex items-center justify-center rounded-md border border-border bg-muted/20">
              <div className="space-y-3 w-full px-6">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          ) : internalSelectedEvent && chartData.length > 0 ? (
            <div className="h-56">
              {chartType === "bar" ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 6" stroke={chartColors.borderColor} opacity={0.5} vertical={false} />
                    <XAxis
                      dataKey="displayName"
                      tick={{ fontSize: 11, fill: chartColors.textColor }}
                      axisLine={{ stroke: chartColors.borderColor }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: chartColors.textColor }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ paddingTop: "12px", fontSize: "12px", color: chartColors.foregroundColor }}
                      iconSize={8}
                      iconType="circle"
                    />
                    <Bar dataKey="Present" fill={COLORS.present} name="Present" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Absent" fill={COLORS.absent} name="Absent" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                /* Pie chart for single event */
                <div className="flex flex-col items-center justify-center h-full">
                  {chartData.map((event, index) => {
                    const pieData = [
                      { name: "Present", value: event.Present, color: COLORS.present },
                      { name: "Absent", value: event.Absent, color: COLORS.absent },
                    ];
                    return (
                      <div key={index} className="flex flex-col items-center">
                        <div className="relative">
                          <ResponsiveContainer width={160} height={160}>
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={70}
                                paddingAngle={3}
                                dataKey="value"
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
                                      <div className="rounded-md border border-border bg-card p-2 shadow-md text-xs">
                                        <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.payload.color }} />
                                          <span className="text-muted-foreground">{data.name}</span>
                                          <span className="font-semibold text-foreground">{data.value}</span>
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
                            <span className="text-lg font-bold text-foreground">{event.attendanceRate}%</span>
                          </div>
                        </div>
                        <div className="flex gap-6 mt-3 text-xs">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.present }} />
                            <span className="text-muted-foreground">Present</span>
                            <span className="font-semibold text-foreground">{event.Present}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.absent }} />
                            <span className="text-muted-foreground">Absent</span>
                            <span className="font-semibold text-foreground">{event.Absent}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="h-56 flex flex-col items-center justify-center text-muted-foreground">
              <Calendar className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">
                {internalSelectedEvent ? "No attendance data available" : "Select an event to view attendance"}
              </p>
              <p className="text-xs mt-1 text-center px-4">
                {internalSelectedEvent
                  ? "No attendance records found for this event."
                  : "Choose an event from the dropdown above to see detailed attendance breakdown."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}