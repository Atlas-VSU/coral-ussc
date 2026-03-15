"use client"

import { useState } from "react"
import { EventCard } from "./EventCard"
import { EventListItem } from "./EventListItem"
import { EditEventDialog } from "./EditEventDialog"
import { CalendarIcon } from "lucide-react"
import type { Event } from "../types"
import type { ViewMode } from "./ViewToggle"
import { toast } from "sonner"

interface EventsListProps {
  events: Event[]
  onEventsUpdate: () => void
  viewMode: ViewMode
}

export function EventsList({ events, onEventsUpdate, viewMode }: EventsListProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  const handleEdit = (event: Event) => {
    setSelectedEvent(event)
    setEditOpen(true)
  }

  const handleArchive = async (event: Event) => {
    if (window.confirm(`Archive "${event.name}"?`)) {
      toast.success(`"${event.name}" archived (mock)`)
      onEventsUpdate()
    }
  }

  const handleUnarchive = async (event: Event) => {
    if (window.confirm(`Unarchive "${event.name}"?`)) {
      toast.success(`"${event.name}" unarchived (mock)`)
      onEventsUpdate()
    }
  }

  const handleDelete = async (event: Event) => {
    if (window.confirm(`Permanently delete "${event.name}"? This cannot be undone.`)) {
      toast.success(`"${event.name}" deleted (mock)`)
      onEventsUpdate()
    }
  }

  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-xl bg-muted/30">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <CalendarIcon className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">No events found</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Try adjusting your filters or search to find what you&apos;re looking for.
        </p>
      </div>
    )
  }

  return (
    <>
      {viewMode === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={handleEdit}
              onArchive={handleArchive}
              onUnarchive={handleUnarchive}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {events.map((event) => (
            <EventListItem
              key={event.id}
              event={event}
              onEdit={handleEdit}
              onArchive={handleArchive}
              onUnarchive={handleUnarchive}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {selectedEvent && (
        <EditEventDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          event={selectedEvent}
          onEventEdited={() => {
            onEventsUpdate()
            setEditOpen(false)
            setSelectedEvent(null)
          }}
        />
      )}
    </>
  )
}
