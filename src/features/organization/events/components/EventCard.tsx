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

interface EventCardProps {
  event: Event;
  onEdit: (event: Event) => void;
  onArchive: (event: Event) => void;
  onUnarchive: (event: Event) => void;
  onDelete: (event: Event) => void;
}

export function EventCard({
  event,
  onEdit,
  onArchive,
  onUnarchive,
  onDelete,
}: EventCardProps) {
  const [isOperationLoading, setIsOperationLoading] = useState(false);
  const [isViewAttendeesLoading, setIsViewAttendeesLoading] = useState(false);
  const [isLogAttendanceLoading, setIsLogAttendanceLoading] = useState(false);
  // Format time to 12-hour format
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

  // Get the appropriate badge color and style based on event status
  const getStatusBadge = () => {
    switch (event.status) {
      case "ongoing":
        return (
          <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-400 dark:border-green-600 px-3 py-1.5 font-bold text-xs shadow-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Ongoing
          </Badge>
        );
      case "upcoming":
        return (
          <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-sky-100 text-blue-800 border-blue-300 dark:from-blue-900/30 dark:to-sky-900/30 dark:text-blue-400 dark:border-blue-600 px-3 py-1.5 font-bold text-xs shadow-sm">
            <CalendarIcon className="w-3 h-3 mr-1" />
            Upcoming
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300 dark:from-gray-800/50 dark:to-slate-800/50 dark:text-gray-300 dark:border-gray-600 px-3 py-1.5 font-bold text-xs shadow-sm">
            Completed
          </Badge>
        );
      case "archived":
        return (
          <Badge variant="outline" className="text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600 px-3 py-1.5 font-bold text-xs">
            Archived
          </Badge>
        );
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
  };

  const handleArchiveEvent = async () => {
    setIsOperationLoading(true);
    try {
      await onArchive(event);
    } finally {
      setIsOperationLoading(false);
    }
  };

  const handleUnarchiveEvent = async () => {
    setIsOperationLoading(true);
    try {
      await onUnarchive(event);
    } finally {
      setIsOperationLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    setIsOperationLoading(true);
    try {
      await onDelete(event);
    } finally {
      setIsOperationLoading(false);
    }
  };

  const handleViewAttendees = () => {
    setIsViewAttendeesLoading(true);
    // Simulate brief loading for user feedback
    setTimeout(() => {
      setIsViewAttendeesLoading(false);
    }, 500);
  };

  const handleLogAttendance = () => {
    setIsLogAttendanceLoading(true);
    // Simulate brief loading for user feedback
    setTimeout(() => {
      setIsLogAttendanceLoading(false);
    }, 500);
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-blue-300 dark:border-blue-600 bg-blue-50/30 dark:bg-blue-900/10 overflow-hidden h-full flex flex-col">
      {/* Card Header */}
      <CardHeader className=" px-6 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Title with tooltip for long names */}
            <div className="mb-4">
              {event.name.length > 30 ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 break-words leading-tight cursor-help line-clamp-2">
                        {event.name}
                      </CardTitle>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{event.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 break-words leading-tight">
                  {event.name}
                </CardTitle>
              )}
            </div>
            
            {/* Badges row - flexible wrapping layout */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {getStatusBadge()}
              {event.majorEvent && (
                <Badge
                  variant="outline"
                  className="bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-800 border-amber-300 dark:from-amber-900/30 dark:to-yellow-900/30 dark:text-amber-400 dark:border-amber-600 px-3 py-1.5 w-fit font-bold text-xs shadow-sm"
                >
                  <StarIcon className="h-3 w-3 mr-1 fill-amber-600 dark:fill-amber-400" />
                  Major Event
                </Badge>
              )}
            </div>
            
            <div className="flex items-center text-sm font-semibold text-gray-600 dark:text-gray-400">
              <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="break-words">{formatDate(event.date)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-10 w-10 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 flex-shrink-0 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <MoreHorizontalIcon className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 shadow-lg">
                {event.status === "archived" ? (
                  <>
                    <DropdownMenuItem 
                      onClick={handleUnarchiveEvent} 
                      className="font-medium"
                      disabled={isOperationLoading}
                    >
                      {isOperationLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Unarchiving...
                        </>
                      ) : (
                        "Unarchive"
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleDeleteEvent}
                      className="text-red-600 dark:text-red-400 font-medium"
                      disabled={isOperationLoading}
                    >
                      {isOperationLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete"
                      )}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem onClick={handleEditEvent} className="font-medium" disabled={isOperationLoading}>
                      Edit Event
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleArchiveEvent}
                      className="text-red-600 dark:text-red-400 font-medium"
                      disabled={isOperationLoading}
                    >
                      {isOperationLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Archiving...
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

        {/* Action Buttons */}
        {event.status !== "upcoming" && (
          <div className="pt-5 border-t border-gray-100 dark:border-gray-700 mt-auto">
            <div className="flex flex-col gap-3">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full justify-center hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold text-sm h-11 border-2"
                disabled={isViewAttendeesLoading}
                onClick={handleViewAttendees}
              >
                <Link href={`/org-events/${event.id}/attendees`}>
                  {isViewAttendeesLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <UsersIcon className="mr-2 h-4 w-4" />
                      View Attendees
                    </>
                  )}
                </Link>
              </Button>

              {(event.status === "ongoing" || event.status === "completed") && (
                <Button
                  asChild
                  size="sm"
                  className="w-full justify-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 font-bold text-sm h-12 shadow-md hover:shadow-lg transition-all duration-200"
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
