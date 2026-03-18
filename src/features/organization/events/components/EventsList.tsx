import { useState } from "react";
import { EventCard } from "./EventCard";
import { EventListItem } from "./EventListItem";
import { EditEventDialog } from "./EditEventDialog";
import { CalendarIcon } from "lucide-react";
import { Event } from "../types";
import { archiveEvent, deleteEvent } from "@/firebase";
import { ViewMode } from "./ViewToggle";
import { useEventFineTypes } from "../hooks/useEventFineTypes";
import { BulkFinesIssuance } from "../../fines/components/BulkFinesIssuance";
import { toast } from "sonner";

interface EventsListProps {
  events: Event[];
  onEventsUpdate: () => void;
  viewMode: ViewMode;
}

export function EventsList({ events, onEventsUpdate, viewMode }: EventsListProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const {fineTypes, fetchFineTypes } = useEventFineTypes();
  const [isBulkIssueFinesOpen, setBulkIssueFinesOpen] = useState(false);

  const handleEditClick = async (event: Event) => {
    setSelectedEvent(event);
    setIsEditDialogOpen(true);
    fetchFineTypes(); //temporary
  };

  const handleArchiveClick = async (event: Event) => {
    if (window.confirm(`Are you sure you want to archive "${event.name}"?`)) {
      await archiveEvent(event.id.toString());
      toast.success(`"${event.name}" has been archived.`);
      onEventsUpdate();
    }
  };

    const handleIssueClick = async (event: Event) => {
    setSelectedEvent(event);
    setBulkIssueFinesOpen(true);
    toast.success(`Fines issued for "${event.name}".`);
  };

  const handleDeleteClick = async (event: Event) => {
    if (
      window.confirm(
        `Are you sure you want to permanently delete "${event.name}"? This action cannot be undone.`
      )
    ) {
      await deleteEvent(event.id.toString());
      toast.success(`"${event.name}" has been deleted.`);
      onEventsUpdate();
    }
  };

  const eventName = selectedEvent ? selectedEvent.name : "Event";

  const handleEventEdited = () => {
    onEventsUpdate();
    setIsEditDialogOpen(false);
    setSelectedEvent(null);
    toast.success(`"${eventName}" has been updated.`);
  };

  const handleUnarchiveClick = async (event: Event) => {
    if (window.confirm(`Are you sure you want to unarchive "${event.name}"?`)) {
      window.alert("Unarchive logic to be implemented!");
      
    }
  };

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
          {events.map((event, index) => (
            <div
              key={event.id}
              className={`animate-fade-in-up animation-delay-${700 + (index % 6) * 100}`}
            >
              <EventCard
                event={event}
                onEdit={handleEditClick}
                onArchive={handleArchiveClick}
                onIssueFine={handleIssueClick}
                onUnarchive={handleUnarchiveClick}
                onDelete={handleDeleteClick}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {events.map((event, index) => (
            <div
              key={event.id}
              className={`animate-fade-in-up animation-delay-${700 + (index % 6) * 100}`}
            >
              <EventListItem
                event={event}
                onEdit={handleEditClick}
                onArchive={handleArchiveClick}
                onIssueFine={handleIssueClick}
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
          fineTypes ={fineTypes}
          onOpenChange={setIsEditDialogOpen}
          selectedEvent={selectedEvent}
          onEventEdited={handleEventEdited}
        />
      )}
      {selectedEvent && (
        <BulkFinesIssuance
        open={isBulkIssueFinesOpen}
        onOpenChange={setBulkIssueFinesOpen}
        event={selectedEvent}
        />
      )}
    </>
  );
}