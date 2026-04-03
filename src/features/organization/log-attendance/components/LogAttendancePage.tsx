"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { AttendanceInterface } from "@/features/organization/log-attendance/components/AttendanceInterface";
import { PageHeader } from "@/features/organization/log-attendance/components/PageHeader";
import { Event } from "@/features/organization/events/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { ArrowLeftIcon, CalendarIcon } from "lucide-react";
import Link from "next/link";
import {
  checkLogAttendanceExist,
  getEventById,
  logAttendance,
} from "@/firebase";
import { toast } from "sonner";

export default function LogAttendancePage() {
  const params = useParams();
  const eventId = params.id?.toString();

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(async () => {
      const foundEvent = await getEventById(eventId as string);
      setEvent(foundEvent || null);
      setIsLoading(false);
    }, 500);
  }, [eventId]);

  const handleLogAttendance = async (
    studentId: string,
    type: "time-in" | "time-out"
  ) => {
    if (!event) return;
    try {
      const exist = await checkLogAttendanceExist(
        eventId as string,
        studentId,
        type
      );
      if (exist) {
        toast.error("Attendance record already exists.");
        return;
      } else {
        await logAttendance({ eventId: eventId as string, studentId, type });
        const actionText = type === "time-in" ? "checked in" : "checked out";
        const eventText =
          event.status === "completed"
            ? "special attendance logged"
            : `${actionText} successfully`;
        toast.success(`Student ${eventText} for ${event.name}`);
      }
    } catch (error) {
      console.error("Failed to log attendance:", error);
      toast.error("Failed to log attendance. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 pb-5 lg:pb-0">
        {/* Breadcrumb skeleton */}
        <Skeleton className="h-5 w-64" />

        {/* PageHeader skeleton */}
        <div
          className="rounded-xl px-4 sm:px-6 py-4 sm:py-6"
          style={{
            background:
              "linear-gradient(135deg, #ffffff 10%, #EAF3DE 100%, #C0DD97 100%)",
            boxShadow: "0 4px 24px 0 rgba(5,140,17,0.08)",
          }}
        >
          <div className="flex items-start gap-3 mb-6">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="flex-1">
              <Skeleton className="h-6 w-48 mb-1" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div
            className="h-px w-full mb-6"
            style={{
              background:
                "linear-gradient(to right, transparent, #97C459, transparent)",
            }}
          />
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <Skeleton className="h-6 w-64 mb-1" />
                <Skeleton className="h-1 w-10 rounded-full" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ background: "#ffffff" }}
                >
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-3 w-16 mb-1" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AttendanceInterface skeleton */}
        <div
          className="rounded-xl px-4 sm:px-6 py-4 sm:py-6"
          style={{
            background:
              "linear-gradient(135deg, #ffffff 10%, #EAF3DE 100%, #C0DD97 100%)",
            boxShadow: "0 4px 24px 0 rgba(5,140,17,0.08)",
          }}
        >
          <Skeleton className="h-10 w-full rounded-lg mb-4" />
          <Skeleton className="h-14 w-full rounded-lg mb-4" />
          <Skeleton className="h-52 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col gap-6 pb-5 lg:pb-0">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/org-events" className="font-nunito-sans">
                  Events
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-nunito-sans">
                Unknown Event
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div
          className="flex flex-col items-center justify-center py-20 text-center rounded-xl border"
          style={{
            background:
              "linear-gradient(135deg, #ffffff 10%, #EAF3DE 100%, #C0DD97 100%)",
            borderColor: "#97C459",
            boxShadow: "0 4px 24px 0 rgba(5,140,17,0.08)",
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ background: "#EAF3DE" }}
          >
            <CalendarIcon className="w-8 h-8" style={{ color: "#058C11" }} />
          </div>
          <h1
            className="font-nunito text-xl font-bold mb-2"
            style={{ color: "#27500A" }}
          >
            Event Not Found
          </h1>
          <p
            className="font-nunito-sans text-sm mb-6 max-w-xs"
            style={{ color: "#3B6D11" }}
          >
            The event you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Button
            asChild
            className="text-white border-0 shadow-sm"
            style={{ background: "linear-gradient(135deg, #058C11, #38B000)" }}
          >
            <Link href="/org-events">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Events
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-5 lg:pb-0">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                href="/org-events"
                className="font-nunito-sans text-muted-foreground hover:text-foreground transition-colors"
              >
                Events
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-nunito-sans font-medium">
              {event.name}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader event={event} />
      <AttendanceInterface event={event} onLogAttendance={handleLogAttendance} />
    </div>
  );
}