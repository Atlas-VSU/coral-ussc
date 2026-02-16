"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { AttendanceInterface } from "@/features/organization/log-attendance/components/AttendanceInterface";
import { PageHeader } from "@/features/organization/log-attendance/components/PageHeader";
import { Event } from "@/features/organization/events/types";
import { Card } from "@/components/ui/card";
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
import { ArrowLeftIcon } from "lucide-react";
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
    // Simulate loading event data
    setIsLoading(true);

    setTimeout(async () => {
      const foundEvent = await getEventById(eventId as string);
      setEvent(foundEvent || null);
      setIsLoading(false);
    }, 500); // Simulate network delay
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
        await logAttendance({
          eventId: eventId as string,
          studentId,
          type,
        });

        // Show success message with appropriate wording for completed events
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto p-4">
          {/* Breadcrumb Skeleton */}
          <div className="mb-6">
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-8 w-1/2 mb-8" />
          <Card className="p-6">
            <Skeleton className="h-8 w-full mb-4" />
            <Skeleton className="h-12 w-full mb-6" />
            <Skeleton className="h-48 w-full" />
          </Card>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto p-4">
          {/* Breadcrumb */}
          <div className="mb-6">
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
                  <BreadcrumbPage className="font-nunito-sans">Unknown Event</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Event Not Found</h1>
            <p className="text-muted-foreground mb-4">
              The event you&apos;re looking for doesn&apos;t exist or has been
              removed.
            </p>
            <Button asChild>
              <Link href="/org-events">
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Back to Events
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-4">
        {/* Breadcrumb */}
        <div className="mb-6">
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
                <BreadcrumbPage className="font-nunito-sans">{event.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <PageHeader event={event} />
        <AttendanceInterface
          event={event}
          onLogAttendance={handleLogAttendance}
        />
      </div>
    </div>
  );
}
