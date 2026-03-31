import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPinIcon, ClockIcon, UsersIcon, StarIcon, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Event } from "../types";
import { Skeleton } from "@/components/ui/skeleton";

interface ShortcutLinksProps {
  upcomingEvents: Event[];
  ongoingEvents: Event[];
  isLoading: boolean;
}

export function ShortcutLinks({
  upcomingEvents,
  ongoingEvents,
  isLoading,
}: ShortcutLinksProps) {
  const uniqueEventsMap = new Map();
  ongoingEvents.forEach((event) => uniqueEventsMap.set(event.id, event));
  upcomingEvents.forEach((event) => {
    if (!uniqueEventsMap.has(event.id)) uniqueEventsMap.set(event.id, event);
  });
  const allEvents = Array.from(uniqueEventsMap.values()).slice(0, 3);

  const formatTime = (time: string | null) => {
    if (!time) return null;
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const formatTimeRange = (start: string | null, end: string | null) => {
    if (!start || !end) return null;
    return `${formatTime(start)} – ${formatTime(end)}`;
  };

  const getTimeDisplay = (
    timeInStart: string | null,
    timeInEnd: string | null,
    timeOutStart: string | null,
    timeOutEnd: string | null,
  ) => {
    if (timeInStart && timeInEnd && timeOutStart && timeOutEnd) {
      return (
        <>
          <span>In: {formatTimeRange(timeInStart, timeInEnd)}</span>
          <span className="mx-1 text-border">·</span>
          <span>Out: {formatTimeRange(timeOutStart, timeOutEnd)}</span>
        </>
      );
    } else if (timeInStart) {
      return <span>Time-in: {formatTimeRange(timeInStart, timeInEnd)}</span>;
    } else if (timeOutStart) {
      return <span>Time-out: {formatTimeRange(timeOutStart, timeOutEnd)}</span>;
    }
    return <span className="text-muted-foreground">No time set</span>;
  };

  const formatDate = (date: string | Date) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const EventSkeletons = () => (
    <>
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-md border border-border px-3 py-2.5 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-16 ml-auto" />
          </div>
          <Skeleton className="h-3 w-28" />
          <div className="flex gap-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </>
  );

  return (
    <Card className="border-border bg-card gap-0">
      <CardHeader className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
            <CalendarRange className="size-4 text-primary" />
            Quick Access
          </div>
          <Button asChild variant="outline" size="sm" className="text-xs h-7">
            <Link href="/org-events">View All</Link>
          </Button>
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Recent events
        </CardDescription>
      </CardHeader>

      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="flex flex-col gap-2">
          {isLoading ? (
            <EventSkeletons />
          ) : allEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CalendarRange className="h-8 w-8 mb-3 opacity-40" />
              <p className="text-sm font-medium">No events found</p>
              <p className="text-xs mt-1">Create your first event to get started</p>
            </div>
          ) : (
            allEvents.map((event, index) => (
              <Link
                href={`/org-events/${event.id}/attendees`}
                key={`${event.id}-${index}`}
              >
                <div className="flex flex-col gap-1.5 rounded-md border border-border px-3 py-2.5 hover:bg-muted/40 transition-colors">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <CalendarRange className="size-3.5 text-primary shrink-0" />
                      <p className="text-sm font-medium text-foreground truncate">
                        {event.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {event.majorEvent && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 px-1.5 py-0"
                        >
                          <StarIcon className="h-2.5 w-2.5 fill-amber-500 mr-0.5" />
                          Major
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pl-5">
                    <span>{formatDate(event.date)}</span>
                    <span className="flex items-center gap-1">
                      <MapPinIcon className="size-3" />
                      {event.location}
                    </span>
                  </div>

                  {/* Schedule row */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground pl-5">
                    <ClockIcon className="size-3 shrink-0" />
                    <span>
                      {getTimeDisplay(
                        event.timeInStart ?? null,
                        event.timeInEnd ?? null,
                        event.timeOutStart ?? null,
                        event.timeOutEnd ?? null,
                      )}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}