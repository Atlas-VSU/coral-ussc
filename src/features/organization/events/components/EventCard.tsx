import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  MoreHorizontalIcon,
  UserPlusIcon,
  UsersIcon,
  StarIcon,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { Event } from "../types";
import { formatDate } from "@/utils/useGeneralUtils";
import { useState } from "react";
import { getTime } from "date-fns";
import { cn } from "@/lib/utils";

interface EventCardProps {
  event: Event;
  onEdit: (event: Event) => void;
  onArchive: (event: Event) => void;
  onIssueFine: (event: Event) => void;
  onUnarchive: (event: Event) => void;
  onDelete: (event: Event) => void;
}


export function EventCard({ event, onEdit, onArchive, onIssueFine, onUnarchive, onDelete }: EventCardProps) {
  const [isOperationLoading, setIsOperationLoading] = useState(false);
  const [isViewAttendeesLoading, setIsViewAttendeesLoading] = useState(false);
  const [isLogAttendanceLoading, setIsLogAttendanceLoading] = useState(false);

  const { timeInStart, timeInEnd, timeOutStart, timeOutEnd } = event;
  const hasTimeIn = timeInStart && timeInEnd;
  const hasTimeOut = timeOutStart && timeOutEnd;

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
    timeEnd: string | null
  ) => {
    if (!timeStart || !timeEnd) return null;
    return `${formatTime(timeStart)} - ${formatTime(timeEnd)}`;
  };

  // Function to display the time information with proper terminology
  const getTimeDisplay = () => {
    const { timeInStart, timeInEnd, timeOutStart, timeOutEnd } = event;

    const hasTimeIn = timeInStart && timeInEnd;
    const hasTimeOut = timeOutStart && timeOutEnd;

    if (hasTimeIn && hasTimeOut) {
      return (
        <div className="space-y-1">
          <div className="text-xs font-bold mr-2 uppercase tracking-wider min-w-[30px]">Time In: {formatTimeRange(timeInStart, timeInEnd)}</div>
          <div className="text-xs font-bold mr-2 uppercase tracking-wider min-w-[30px]">Time Out: {formatTimeRange(timeOutStart, timeOutEnd)}</div>
        </div>
      );
    } else if (hasTimeIn) {
      return <div className="text-xs font-bold mr-2 uppercase tracking-wider min-w-[30px]">Time In: {formatTimeRange(timeInStart, timeInEnd)}</div>
    } else if (hasTimeOut) {
      return <div className="text-xs font-bold mr-2 uppercase tracking-wider min-w-[30px]">Time Out: {formatTimeRange(timeOutStart, timeOutEnd)}</div>
    } else {
      return "No time set";
    }
  };


  const getStatusBadge = () => {
    switch (event.status) {
      case "ongoing":
        return (
          <Badge className="bg-[#C8E6C9] text-[#1B5E20] border-[#A5D6A7] font-semibold text-xs px-2.5 py-1">
          <span className="w-1.5 h-1.5 bg-[#1B5E20] rounded-full mr-1.5 animate-pulse inline-block" />
          Ongoing
        </Badge>
          )
        case "upcoming":
          return (
            <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-semibold text-xs px-2.5 py-1">
              <CalendarIcon className="w-3 h-3 mr-1" />
              Upcoming
            </Badge>
          )
        case "completed":
          return (
            <Badge variant="outline" className="bg-muted text-muted-foreground font-semibold text-xs px-2.5 py-1">
              Completed
            </Badge>
          )
        case "archived":
          return (
            <Badge variant="outline" className="text-muted-foreground font-semibold text-xs px-2.5 py-1">
              Archived
            </Badge>
          )
          default:
        return (
          <Badge variant="secondary" className="px-3 py-1.5 font-bold text-xs">
            {((event.status as string).charAt(0).toUpperCase() + (event.status as string).slice(1))}
          </Badge>
        );
    }
  };

  const handleEditEvent = () => {
    onEdit(event);
  }

  const handleIssueFine = () => {
    onIssueFine(event);
  }

  const handleArchiveEvent = async () => {
    setIsOperationLoading(true);
    try { 
      await onArchive(event);
    } finally { 
      setIsOperationLoading(false);
    }
  }

  const handleUnarchiveEvent = async () => {
    setIsOperationLoading(true);
    try { 
      await onUnarchive(event);
    } finally { 
      setIsOperationLoading(false);
    }
  }

  const handleDeleteEvent = async () => {
    setIsOperationLoading(true);
    try { 
      await onDelete(event); 
    } finally { 
      setIsOperationLoading(false); 
    }
  }

  const handleViewAttendees = () => {
    setIsViewAttendeesLoading(true);
    setTimeout(() => {
      setIsViewAttendeesLoading(false);
    }, 500);
  }

  const handleLogAttendance = () => {
    setIsLogAttendanceLoading(true);
    setTimeout(() => {
      setIsLogAttendanceLoading(false);
    }, 500);
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border bg-card overflow-hidden h-full flex flex-col">
      {/* Card Header */}
      <CardHeader className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Title with tooltip for long names */}
            <div className="mb-4">
              {event.name.length > 30 ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                    <CardTitle className="text-base font-bold text-foreground leading-tight line-clamp-2 cursor-help">
                        {event.name}
                      </CardTitle>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{event.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
              <CardTitle className="text-base font-bold text-foreground leading-tight">
                  {event.name}
                </CardTitle>
              )}
            </div>
            
            {/* Badges row - flexible wrapping layout */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {getStatusBadge()}
              {event.majorEvent && (
                <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 font-semibold text-xs px-2.5 py-1">
                  <StarIcon className="h-3 w-3 mr-1 fill-amber-600" />
                  Major Event
                </Badge>
              )}
            </div>
            
            <div className="flex items-center text-sm font-semibold text-gray-600 dark:text-gray-400">
              <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="break-words">{formatDate(event.date)}</span>
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {event.status === "archived" ? (
                <>
                  <DropdownMenuItem
                    onClick={handleUnarchiveEvent} 
                    disabled={isOperationLoading}
                  >
                    {isOperationLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Unarchiving…
                      </>
                    ) : ( 
                      "Unarchive" 
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDeleteEvent}
                    className="text-destructive"
                    disabled={isOperationLoading}
                  >
                    {isOperationLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting…
                        </>
                    ) : (
                      "Delete"
                    )}
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  {(!event.finesGenerated && event.status === "completed") && (<DropdownMenuItem onClick={handleIssueFine} className="font-medium" disabled={isOperationLoading}>
                      Issue Fines
                  </DropdownMenuItem>)}
                  <DropdownMenuItem onClick={handleEditEvent} disabled={isOperationLoading}>
                    Edit Event
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleArchiveEvent}
                    className="text-destructive"
                    disabled={isOperationLoading}
                  >
                    {isOperationLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Archiving…
                      </>
                    ) : (
                      "Archive"
                    )}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700"></div>

      {/* Card Content */}
      <CardContent className="px-6 pb-6 space-y-5 flex-1 flex flex-col">
        <div className="space-y-5 flex-1">
          {/* Location */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0">
              <MapPinIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Location</p>
              {event.location.length > 40 ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words leading-relaxed cursor-help line-clamp-2">
                        {event.location}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{event.location}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words leading-relaxed">{event.location}</p>
              )}
            </div>
          </div>

          {/* Time */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0">
              <ClockIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Schedule</p>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-relaxed">{getTimeDisplay()}</div>
            </div>
          </div>

          {/* Attendees */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0">
              <UsersIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Attendance</p>
              <p className="text-base font-bold text-gray-900 dark:text-gray-100 leading-relaxed">
                {event.status === "upcoming"
                  ? "Not started"
                  : `${event.attendees} attendees`}
              </p>
            </div>
          </div>

          {/* Notes */}
          {event.note && (
            <>
              <div className="border-t border-gray-100 dark:border-gray-700 pt-5">
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 rounded-xl p-5 border border-gray-200/50 dark:border-gray-700/50">
                  <div className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-3 uppercase tracking-wider flex items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                    Additional Notes
                  </div>
                  {event.note.length > 100 ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 break-words leading-relaxed cursor-help line-clamp-3">
                            {event.note}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-sm">{event.note}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 break-words leading-relaxed">{event.note}</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Schedule */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center shrink-0 mt-0.5">
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Schedule</p>
            <div className="text-sm font-medium text-foreground">{getTimeDisplay()}</div>
          </div>
        </div>

        {/* Attendees */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center shrink-0 mt-0.5">
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Attendance</p>
            <p className="text-sm font-medium text-foreground">
              {event.status === "upcoming" ? "Not started" : `${event.attendees} attendees`}
            </p>
          </div>
        </div>

        {/* Note */}
        {event.note && (
          <div className="mt-auto pt-3 border-t border-border">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
            <p className={cn("text-xs text-muted-foreground leading-relaxed", event.note.length > 80 && "line-clamp-3")}>
              {event.note}
            </p>
          </div>
        )}

        {/* Action Buttons — Log Attendance & View Attendees */}
        {event.status !== "upcoming" && event.status !== "archived" && (
          <div className="mt-auto pt-3 border-t border-border flex flex-col gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full justify-center gap-1.5 h-10 sm:h-9 text-xs font-semibold"
              onClick={handleViewAttendees}
              disabled={isViewAttendeesLoading}
            >
              <Link href={`/org-events/${event.id}/attendees`}>
                {isViewAttendeesLoading ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" />Loading…</>
                ) : (
                  <><UsersIcon className="h-3.5 w-3.5" />View Attendees</>
                )}
              </Link>
            </Button>

            {(event.status === "ongoing" || event.status === "completed") && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full justify-center hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold text-sm h-11 border-2"  
                onClick={handleViewAttendees}
              >
                <Link href={`/org-events/${event.id}/attendees`}>
                  {isViewAttendeesLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>  ) : (
                      <>
                        <UsersIcon className="mr-2 h-4 w-4" />
                        View Attendees
                      </>
                    )}
                  </Link>
                
              </Button>)}

              {(event.status === "ongoing" || event.status === "completed") && (
                <Button
                  asChild
                  size="sm"
                  className="w-full justify-center gap-1.5 h-10 sm:h-9 text-xs font-bold"
                  disabled={isLogAttendanceLoading}
                  onClick={handleLogAttendance}
                >
                  <Link href={`/org-events/${event.id}/log-attendance`}>
                    {isLogAttendanceLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <UserPlusIcon className="mr-2 h-4 w-4" />
                        {event.status === "completed" ? "Log Special Attendance" : "Log Attendance"}
                      </>
                    )}
                  </Link>
                </Button>
              )}
            </div>
          )}
      </CardContent>
    </Card>
  );
}