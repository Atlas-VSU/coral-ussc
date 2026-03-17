"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
import { cn } from "@/lib/utils"
import type { Event } from "../types"

interface EventCardProps {
  event: Event
  onEdit: (event: Event) => void
  onArchive: (event: Event) => void
  onUnarchive: (event: Event) => void
  onDelete: (event: Event) => void
}

function formatTime(time: string | null | undefined) {
  if (!time) return null
  const [hours, minutes] = time.split(":")
  const hour = parseInt(hours, 10)
  const ampm = hour >= 12 ? "PM" : "AM"
  const h12 = hour % 12 || 12
  return `${h12}:${minutes} ${ampm}`
}

function formatTimeRange(start: string | null | undefined, end: string | null | undefined) {
  if (!start || !end) return null
  return `${formatTime(start)} – ${formatTime(end)}`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function StatusBadge({ status }: { status: Event["status"] }) {
  switch (status) {
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
  }
}

export function EventCard({ event, onEdit, onArchive, onUnarchive, onDelete }: EventCardProps) {
  const [opLoading, setOpLoading] = useState(false)
  const [viewAttendeesLoading, setViewAttendeesLoading] = useState(false)
  const [logAttendanceLoading, setLogAttendanceLoading] = useState(false)

  const { timeInStart, timeInEnd, timeOutStart, timeOutEnd } = event
  const hasTimeIn = timeInStart && timeInEnd
  const hasTimeOut = timeOutStart && timeOutEnd

  const timeDisplay = hasTimeIn || hasTimeOut ? (
    <div className="space-y-0.5">
      {hasTimeIn && (
        <div className="text-xs font-semibold uppercase tracking-wide">
          In: {formatTimeRange(timeInStart, timeInEnd)}
        </div>
      )}
      {hasTimeOut && (
        <div className="text-xs font-semibold uppercase tracking-wide">
          Out: {formatTimeRange(timeOutStart, timeOutEnd)}
        </div>
      )}
    </div>
  ) : (
    <span className="text-xs text-muted-foreground">No time set</span>
  )

  const handleArchive = async () => {
    setOpLoading(true)
    try { await onArchive(event) } finally { setOpLoading(false) }
  }

  const handleUnarchive = async () => {
    setOpLoading(true)
    try { await onUnarchive(event) } finally { setOpLoading(false) }
  }

  const handleDelete = async () => {
    setOpLoading(true)
    try { await onDelete(event) } finally { setOpLoading(false) }
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
    <Card className="group hover:shadow-lg transition-all duration-300 border-border bg-card overflow-hidden h-full flex flex-col">
      <CardHeader className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              <StatusBadge status={event.status} />
              {event.majorEvent && (
                <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 font-semibold text-xs px-2.5 py-1">
                  <StarIcon className="h-3 w-3 mr-1 fill-amber-600" />
                  Major
                </Badge>
              )}
            </div>

            {/* Title */}
            {event.name.length > 32 ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CardTitle className="text-base font-bold text-foreground leading-tight line-clamp-2 cursor-help">
                      {event.name}
                    </CardTitle>
                  </TooltipTrigger>
                  <TooltipContent><p className="max-w-xs">{event.name}</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <CardTitle className="text-base font-bold text-foreground leading-tight">
                {event.name}
              </CardTitle>
            )}

            {/* Date */}
            <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
              <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
              <span>{formatDate(event.date)}</span>
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
                  <DropdownMenuItem onClick={handleUnarchive} disabled={opLoading}>
                    {opLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Unarchiving…</> : "Unarchive"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive"
                    disabled={opLoading}
                  >
                    {opLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting…</> : "Delete"}
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => onEdit(event)} disabled={opLoading}>
                    Edit Event
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleArchive}
                    className="text-destructive"
                    disabled={opLoading}
                  >
                    {opLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Archiving…</> : "Archive"}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <div className="border-t border-border mx-5" />

      <CardContent className="px-5 py-4 flex-1 flex flex-col gap-4">
        {/* Location */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center shrink-0 mt-0.5">
            <MapPinIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Location</p>
            <p className="text-sm font-medium text-foreground wrap-break-word leading-snug">{event.location}</p>
          </div>
        </div>

        {/* Schedule */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center shrink-0 mt-0.5">
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Schedule</p>
            <div className="text-sm font-medium text-foreground">{timeDisplay}</div>
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
              disabled={viewAttendeesLoading}
            >
              <Link href={`/org-events/${event.id}/attendees`}>
                {viewAttendeesLoading ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" />Loading…</>
                ) : (
                  <><UsersIcon className="h-3.5 w-3.5" />View Attendees</>
                )}
              </Link>
            </Button>

            {(event.status === "ongoing" || event.status === "completed") && (
              <Button
                asChild
                size="sm"
                className="w-full justify-center gap-1.5 h-10 sm:h-9 text-xs font-bold"
                onClick={handleLogAttendance}
                disabled={logAttendanceLoading}
              >
                <Link href={`/admin-events/${event.id}/log-attendance`}>
                  {logAttendanceLoading ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" />Loading…</>
                  ) : (
                    <><UserPlusIcon className="h-3.5 w-3.5" />{event.status === "completed" ? "Log Special Attendance" : "Log Attendance"}</>
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
