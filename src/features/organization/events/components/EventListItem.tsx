"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  MoreHorizontalIcon,
  UsersIcon,
  UserPlusIcon,
  StarIcon,
  Loader2,
} from "lucide-react"
import type { Event } from "../types"
import { formatDate } from "@/utils/useGeneralUtils"

interface EventListItemProps {
  event: Event
  onEdit: (event: Event) => void
  onArchive: (event: Event) => void
  onUnarchive: (event: Event) => void
  onDelete: (event: Event) => void
  onIssueFine: (event: Event) => void
  onMarkAsCompleted: (event: Event) => void
}

function formatTime(time: string | null | undefined) {
  if (!time) return null
  const [hours, minutes] = time.split(":")
  const hour = parseInt(hours, 10)
  const ampm = hour >= 12 ? "PM" : "AM"
  const h12 = hour % 12 || 12
  return `${h12}:${minutes} ${ampm}`
}

function formatTimeRange(
  start: string | null | undefined,
  end: string | null | undefined,
) {
  if (!start || !end) return null
  return `${formatTime(start)} – ${formatTime(end)}`
}

function StatusBadge({ status }: { status: Event["status"] }) {
  switch (status) {
    case "ongoing":
      return (
        <Badge className="bg-[#C8E6C9] text-[#1B5E20] border-[#A5D6A7] font-semibold text-xs">
          <span className="w-1.5 h-1.5 bg-[#1B5E20] rounded-full mr-1.5 animate-pulse inline-block" />
          Ongoing
        </Badge>
      )
    case "upcoming":
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-semibold text-xs">
          <CalendarIcon className="w-3 h-3 mr-1" />
          Upcoming
        </Badge>
      )
    case "completed":
      return (
        <Badge
          variant="outline"
          className="bg-muted text-muted-foreground font-semibold text-xs"
        >
          Completed
        </Badge>
      )
    case "archived":
      return (
        <Badge
          variant="outline"
          className="text-muted-foreground font-semibold text-xs"
        >
          Archived
        </Badge>
      )
  }
}

export function EventListItem({
  event,
  onEdit,
  onArchive,
  onUnarchive,
  onDelete,
  onIssueFine,
  onMarkAsCompleted,
}: EventListItemProps) {
  const [opLoading, setOpLoading] = useState(false)
  const [viewAttendeesLoading, setViewAttendeesLoading] = useState(false)
  const [logAttendanceLoading, setLogAttendanceLoading] = useState(false)

  const { timeInStart, timeInEnd, timeOutStart, timeOutEnd } = event
  const hasTimeIn = timeInStart && timeInEnd
  const hasTimeOut = timeOutStart && timeOutEnd

  const handleArchive = async () => {
    setOpLoading(true)
    try {
      await onArchive(event)
    } finally {
      setOpLoading(false)
    }
  }

  const handleUnarchive = async () => {
    setOpLoading(true)
    try {
      await onUnarchive(event)
    } finally {
      setOpLoading(false)
    }
  }

  const handleDelete = async () => {
    setOpLoading(true)
    try {
      await onDelete(event)
    } finally {
      setOpLoading(false)
    }
  }

  const handleViewAttendees = () => {
    setViewAttendeesLoading(true)
    setTimeout(() => setViewAttendeesLoading(false), 500)
  }

  const handleLogAttendance = () => {
    setLogAttendanceLoading(true)
    setTimeout(() => setLogAttendanceLoading(false), 500)
  }

  return (
    <Card className="hover:shadow-md transition-all duration-200 border-border bg-card overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center gap-4 px-5 py-4">
          {/* Status indicator strip */}
          <div
            className={`w-1 self-stretch rounded-full flex-shrink-0 ${
              event.status === "ongoing"
                ? "bg-[#1B5E20]"
                : event.status === "upcoming"
                  ? "bg-blue-400"
                  : event.status === "completed"
                    ? "bg-muted-foreground/40"
                    : "bg-muted-foreground/20"
            }`}
          />

          {/* Main info */}
          <div className="flex-1 min-w-0 grid sm:grid-cols-[1fr_auto] gap-3 sm:gap-6 items-center">
            {/* Left: name + meta */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <StatusBadge status={event.status} />
                {event.majorEvent && (
                  <Badge
                    variant="outline"
                    className="bg-amber-50 text-amber-800 border-amber-300 font-semibold text-xs"
                  >
                    <StarIcon className="h-3 w-3 mr-1 fill-amber-600" />
                    Major
                  </Badge>
                )}
              </div>
              <h3 className="text-sm font-bold text-foreground leading-snug truncate">
                {event.name}
              </h3>

              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {formatDate(event.date)}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPinIcon className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[160px]">
                    {event.location}
                  </span>
                </span>
                {(hasTimeIn || hasTimeOut) && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ClockIcon className="h-3.5 w-3.5" />
                    {hasTimeIn && (
                      <span>In: {formatTimeRange(timeInStart, timeInEnd)}</span>
                    )}
                    {hasTimeIn && hasTimeOut && <span className="mx-1">·</span>}
                    {hasTimeOut && (
                      <span>
                        Out: {formatTimeRange(timeOutStart, timeOutEnd)}
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* Right: attendees + actions */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="text-right hidden sm:block">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground justify-end">
                  <UsersIcon className="h-4 w-4 text-muted-foreground" />
                  {event.status === "upcoming" ? "—" : event.attendees}
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  Attendees
                </p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                  >
                    <MoreHorizontalIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {event.status === "archived" ? (
                    <>
                      <DropdownMenuItem
                        onClick={handleUnarchive}
                        disabled={opLoading}
                      >
                        {opLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Unarchiving…
                          </>
                        ) : (
                          "Unarchive"
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleDelete}
                        className="text-destructive"
                        disabled={opLoading}
                      >
                        {opLoading ? (
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
                      {!event.finesGenerated &&
                        event.status === "completed" && (
                          <DropdownMenuItem
                            onClick={() => onIssueFine(event)}
                            disabled={opLoading}
                          >
                            Issue Fines
                          </DropdownMenuItem>
                        )}
                      {event.status === "ongoing" && (
                        <DropdownMenuItem
                          onClick={() => onMarkAsCompleted(event)}
                          disabled={opLoading}
                        >
                          Mark as Completed
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => onEdit(event)}
                        disabled={opLoading}
                      >
                        Edit Event
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleArchive}
                        className="text-destructive"
                        disabled={opLoading}
                      >
                        {opLoading ? (
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
          </div>
        </div>

        {/* Action buttons */}
        {event.status !== "upcoming" && event.status !== "archived" && (
          <div className="px-5 pb-4 flex flex-col sm:flex-row gap-2 border-t border-border pt-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-center gap-1.5 text-xs font-semibold h-9 px-3"
              onClick={handleViewAttendees}
              disabled={viewAttendeesLoading}
            >
              <Link
                href={`/org-events/${event.id}/attendees`}
                className="flex items-center gap-1.5 w-full justify-center"
              >
                {viewAttendeesLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading…
                  </>
                ) : (
                  <>
                    <UsersIcon className="h-3.5 w-3.5" />
                    View Attendees
                  </>
                )}
              </Link>
            </Button>

            {(event.status === "ongoing" || event.status === "completed") && (
              <Button
                asChild
                size="sm"
                className="w-full justify-center gap-1.5 text-xs font-semibold h-9 px-3"
                onClick={handleLogAttendance}
                disabled={logAttendanceLoading}
              >
                <Link href={`/org-events/${event.id}/log-attendance`}>
                  {logAttendanceLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Loading…
                    </>
                  ) : (
                    <>
                      <UserPlusIcon className="h-3.5 w-3.5" />
                      {event.status === "completed"
                        ? "Log Special Attendance"
                        : "Log Attendance"}
                    </>
                  )}
                </Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
