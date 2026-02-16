import { useState } from "react";
import { EventCard } from "./EventCard";
import { EventListItem } from "./EventListItem";
import { EditEventDialog } from "./EditEventDialog";
import { Event } from "../types";
import { archiveEvent, deleteEvent } from "@/firebase";
import { ViewMode } from "./ViewToggle";

interface EventsListProps {
  events: Event[];
  onEventsUpdate: () => void;
  viewMode: ViewMode;
}

export function EventsList({ events, onEventsUpdate, viewMode }: EventsListProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const handleEditClick = (event: Event) => {
    setSelectedEvent(event);
    setIsEditDialogOpen(true);
  };

  const handleArchiveClick = async (event: Event) => {
    if (window.confirm(`Are you sure you want to archive "${event.name}"?`)) {
      await archiveEvent(event.id.toString());
      onEventsUpdate();
    }
  };

  const handleDeleteClick = async (event: Event) => {
    if (
      window.confirm(
        `Are you sure you want to permanently delete "${event.name}"? This action cannot be undone.`
      )
    ) {
      await deleteEvent(event.id.toString());
      onEventsUpdate();
    }
  };

  const handleEventEdited = () => {
    onEventsUpdate();
    setIsEditDialogOpen(false);
    setSelectedEvent(null);
  };

  const handleUnarchiveClick = async (event: Event) => {
    if (window.confirm(`Are you sure you want to unarchive "${event.name}"?`)) {
      window.alert("Unarchive logic to be implemented!");
      
    }
  };

  if (!events || events.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
        <div className="flex flex-col items-center justify-center p-16 text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">No events found</h3>
          <p className="text-gray-600 dark:text-gray-400 text-base max-w-md leading-relaxed">
            Try adjusting your filters or search keywords to find the events you&apos;re looking for
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {viewMode === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {events.map((event, index) => (
            <div
              key={event.id}
              className={`animate-fade-in-up animation-delay-${700 + (index % 6) * 100}`}
            >
              <EventCard
                event={event}
                onEdit={handleEditClick}
                onArchive={handleArchiveClick}
                onUnarchive={handleUnarchiveClick}
                onDelete={handleDeleteClick}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event, index) => (
            <div
              key={event.id}
              className={`animate-fade-in-up animation-delay-${700 + (index % 6) * 100}`}
            >
              <EventListItem
                event={event}
                onEdit={handleEditClick}
                onArchive={handleArchiveClick}
                onUnarchive={handleUnarchiveClick}
                onDelete={handleDeleteClick}
              />
            </div>
          ))}
        </div>
      )}
      {selectedEvent && (
        <EditEventDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          selectedEvent={selectedEvent}
          onEventEdited={handleEventEdited}
        />
      )}
    </>
  );
}
