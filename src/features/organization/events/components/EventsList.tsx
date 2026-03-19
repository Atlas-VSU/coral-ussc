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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EventsListProps {
  events: Event[];
  onEventsUpdate: () => void;
  viewMode: ViewMode;
}

type PendingAction = {
  type: "archive" | "delete" | "issue" | "unarchive";
  event: Event;
};

export function EventsList({ events, onEventsUpdate, viewMode }: EventsListProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { fineTypes, fetchFineTypes } = useEventFineTypes();
  const [isBulkIssueFinesOpen, setBulkIssueFinesOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const handleEditClick = async (event: Event) => {
    setSelectedEvent(event);
    setIsEditDialogOpen(true);
    fetchFineTypes();
  };

  const handleArchiveClick = (event: Event) => {
    setPendingAction({ type: "archive", event });
  };

  const handleIssueClick = (event: Event) => {
    setPendingAction({ type: "issue", event });
  };

  const handleDeleteClick = (event: Event) => {
    setPendingAction({ type: "delete", event });
  };

  const handleUnarchiveClick = (event: Event) => {
    setPendingAction({ type: "unarchive", event });
  };

  // Executes after the user confirms
  const handleConfirm = async () => {
    if (!pendingAction) return;
    const { type, event } = pendingAction;

    if (type === "archive") {
      await archiveEvent(event.id.toString());
      toast.success(`"${event.name}" has been archived.`);
      onEventsUpdate();
    } else if (type === "delete") {
      await deleteEvent(event.id.toString());
      toast.success(`"${event.name}" has been deleted.`);
      onEventsUpdate();
    } else if (type === "issue") {
      setSelectedEvent(event);
      setBulkIssueFinesOpen(true);
      toast.success(`Fines issued for "${event.name}".`);
    } else if (type === "unarchive") {
      // TODO: Implement unarchiveEvent in firebase.ts and call it here
      toast.success(`"${event.name}" has been unarchived.`);
      onEventsUpdate();
    }

    setPendingAction(null);
  };

  const handleCancelConfirm = () => {
    setPendingAction(null);
  };

  const confirmContent: Record<PendingAction["type"], { title: string; description: string; confirmLabel: string }> = {
    archive: {
      title: "Archive this event?",
      description: `"${pendingAction?.event.name}" will be archived and hidden from active events.`,
      confirmLabel: "Archive",
    },
    delete: {
      title: "Delete this event?",
      description: `"${pendingAction?.event.name}" will be permanently deleted. This cannot be undone.`,
      confirmLabel: "Delete",
    },
    issue: {
      title: "Issue fines for this event?",
      description: `You're about to issue fines to members for "${pendingAction?.event.name}". Make sure attendance is finalized before proceeding.`,
      confirmLabel: "Issue Fines",
    },
    unarchive: {
      title: "Unarchive this event?",
      description: `"${pendingAction?.event.name}" will be restored and visible in active events.`,
      confirmLabel: "Unarchive",
    },
  };

  const eventName = selectedEvent ? selectedEvent.name : "Event";

  const handleEventEdited = () => {
    onEventsUpdate();
    setIsEditDialogOpen(false);
    setSelectedEvent(null);
    toast.success(`"${eventName}" has been updated.`);
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
    );
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

      {/* Confirmation Dialog */}
      <AlertDialog open={!!pendingAction} onOpenChange={(open) => !open && handleCancelConfirm()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction ? confirmContent[pendingAction.type].title : ""}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction ? confirmContent[pendingAction.type].description : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelConfirm}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={pendingAction?.type === "delete" ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {pendingAction ? confirmContent[pendingAction.type].confirmLabel : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedEvent && (
        <EditEventDialog
          open={isEditDialogOpen}
          fineTypes={fineTypes}
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