import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPinIcon,
  ClockIcon,
  UsersIcon,
  StarIcon,
  CalendarRange,
} from "lucide-react";
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

  ongoingEvents.forEach((event) => {
    uniqueEventsMap.set(event.id, event);
  });

  upcomingEvents.forEach((event) => {
    if (!uniqueEventsMap.has(event.id)) {
      uniqueEventsMap.set(event.id, event);
    }
  });

  const allEvents = Array.from(uniqueEventsMap.values()).slice(0, 3);

  // console.log("ShortcutLinks props:", {
  //   upcomingEvents,
  //   ongoingEvents,
  //   isLoading,
  // });

  const formatTime = (time: string | null) => {
    if (!time) return null;

    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;

    return `${formattedHour}:${minutes} ${ampm}`;
  };

  // Format time range
  const formatTimeRange = (
    timeStart: string | null,
    timeOutStart: string | null
  ) => {
    if (!timeStart || !timeOutStart) return null;
    return `${formatTime(timeStart)} - ${formatTime(timeOutStart)}`;
  };

  // Function to display the time information with proper terminology
  const getTimeDisplay = (
    timeInStart: string | null,
    timeInEnd: string | null,
    timeOutStart: string | null,
    timeOutEnd: string | null
  ) => {
    if (timeInStart && timeInEnd && timeOutStart && timeOutEnd) {
      return (
        <>
          <div>Time-in: {formatTimeRange(timeInStart, timeInEnd)}</div>
          <div>Time-out: {formatTimeRange(timeOutStart, timeOutEnd)}</div>
        </>
      );
    } else if (timeInStart && !timeOutStart) {
      return <div>Time-in only: {formatTimeRange(timeInStart, timeInEnd)}</div>;
    } else if (!timeInStart && timeOutStart) {
      return (
        <div>Time-out only: {formatTimeRange(timeOutStart, timeOutEnd)}</div>
      );
    } else {
      return "No time set";
    }
  };

  // Format date to a user-friendly format
  const formatDate = (date: string | Date) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(date).toLocaleDateString("en-US", options);
  };

  // Skeleton loader for events
  const EventSkeletons = () => (
    <>
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden border-border/50">
          <div className="p-5">
            <div className="flex justify-between items-start mb-4 gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-4 w-32 ml-11" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              <div className="flex items-start gap-3">
                <Skeleton className="h-6 w-6 rounded-md" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Skeleton className="h-6 w-6 rounded-md" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="col-span-1 sm:col-span-2 pt-3 border-t border-border/50">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-6 w-6 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </>
  );

  return (
    <Card className="group relative overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-background via-background/95 to-muted/30 backdrop-blur-xl animate-fade-in-up animation-delay-600">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-50"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-1000"></div>

      <CardHeader className="pb-1 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary shadow-lg">
              <CalendarRange className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-foreground leading-tight tracking-tight">
                Quick Access
              </CardTitle>
              <p className="text-sm text-muted-foreground font-medium mt-0.5">
                Recent and ongoing events
              </p>
            </div>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-2 border-border/50 hover:border-primary/60 transition-all duration-300 bg-background/80 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-105 font-semibold"
          >
            <Link href="/org-events" className="flex items-center gap-2">
              View All
              <CalendarRange className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 relative z-10">
        <div className="space-y-3">
          {isLoading ? (
            <EventSkeletons />
          ) : allEvents.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground animate-fade-in-up animation-delay-800">
              <div className="p-4 rounded-2xl bg-muted/30 w-fit mx-auto mb-4">
                <CalendarRange className="h-8 w-8 opacity-50" />
              </div>
              <p className="text-lg font-semibold mb-2">No events found</p>
              <p className="text-sm">Create your first event to get started</p>
            </div>
          ) : (
            allEvents.map((event, index) => (
              <Link
                href={`/org-events/${event.id}/attendees`}
                key={`${event.id}-${index}`}
                className="block group"
              >
                <Card
                  className={`overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 border-2 border-border/30 hover:border-primary/40 bg-gradient-to-r from-background/80 to-muted/20 backdrop-blur-sm hover:from-background hover:to-primary/5 animate-fade-in-up animation-delay-${
                    800 + index * 100
                  }`}
                >
                  <div className="p-4">
                    {/* Compact Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 group-hover:scale-110">
                          <CalendarRange className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors truncate leading-tight">
                            {event.name}
                          </h3>
                          <p className="text-xs text-muted-foreground font-medium mt-0.5">
                            {formatDate(event.date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {event.majorEvent && (
                          <Badge
                            variant="outline"
                            className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 text-xs px-2 py-0.5"
                          >
                            <StarIcon className="h-3 w-3 fill-amber-500 mr-1" />
                            Major
                          </Badge>
                        )}
                        <Badge
                          variant={
                            event.status === "ongoing" ? "default" : "secondary"
                          }
                          className={`text-xs px-2 py-0.5 transition-colors ${
                            event.status === "ongoing"
                              ? "bg-green-500 hover:bg-green-600 text-white"
                              : "bg-muted hover:bg-muted/80"
                          }`}
                        >
                          {event.status === "ongoing" ? "Ongoing" : "Upcoming"}
                        </Badge>
                      </div>
                    </div>

                    {/* Compact Info Grid */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {/* Location */}
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-muted/50 text-muted-foreground">
                          <MapPinIcon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground font-medium">
                            Location
                          </p>
                          <p className="text-foreground font-medium truncate">
                            {event.location}
                          </p>
                        </div>
                      </div>

                      {/* Attendees */}
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-muted/50 text-muted-foreground">
                          <UsersIcon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground font-medium">
                            Attendees
                          </p>
                          <p className="text-foreground font-medium">
                            {event.status === "ongoing"
                              ? `${event.attendees || 0} checked in`
                              : "Not started"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Time Schedule - Compact */}
                    <div className="mt-3 pt-3 border-t border-border/30">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-muted/50 text-muted-foreground">
                          <ClockIcon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground font-medium mb-1">
                            Schedule
                          </p>
                          <div className="text-xs text-foreground font-medium">
                            {getTimeDisplay(
                              event.timeInStart ?? null,
                              event.timeInEnd ?? null,
                              event.timeOutStart ?? null,
                              event.timeOutEnd ?? null
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
