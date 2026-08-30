import { useState } from "react";
import { EventCard } from "./EventCard";
import { EventListItem } from "./EventListItem";
import { EditEventDialog } from "./EditEventDialog";
import { CalendarIcon, Loader2, SearchXIcon } from "lucide-react";
import { Event } from "../types";
import { Button } from "@/components/ui/button";
import { useTermStore } from "../../term/store";
import { Term } from "../../term/types";
import { archiveEvent, completeEvent, deleteEvent } from "@/firebase";
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
  /** True when a search or date filter is narrowing the list. */
  isFiltered?: boolean;
  /** Current status tab, used to word the empty state. */
  statusLabel?: string;
}

/** "2025-2026 - 2nd Semester", matching the wording of the term selector. */
const formatTerm = (term: Term | null) =>
  term ? `${term.AY} — ${term.semester} Semester` : "this term";

/**
 * Newest term other than the one selected, so the empty state can offer a
 * one-click jump. `getAllTerms` returns terms unordered, so sort here.
 */
const newestOtherTerm = (all: Term[], selected: Term | null) =>
  all
    .filter((t) => t.id !== selected?.id && !t.isDeleted)
    .sort((a, b) =>
      a.AY === b.AY ? b.semester.localeCompare(a.semester) : b.AY.localeCompare(a.AY)
    )[0] ?? null;

type PendingAction = {
  type: "archive" | "delete" | "issue" | "unarchive"|"markAsCompleted";
  event: Event;
};

export function EventsList({
  events,
  onEventsUpdate,
  viewMode,
  isFiltered = false,
  statusLabel,
}: EventsListProps) {
  const { all, selected, setSelected } = useTermStore();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { fineTypes, fetchFineTypes } = useEventFineTypes();
  const [isBulkIssueFinesOpen, setBulkIssueFinesOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleMarkAsCompletedClick = (event: Event) => {
    setPendingAction({ type: "markAsCompleted", event });
   }

  const handleDeleteClick = (event: Event) => {
    setPendingAction({ type: "delete", event });
  };

  const handleUnarchiveClick = (event: Event) => {
    setPendingAction({ type: "unarchive", event });
  };

    const handleBulkIssueFinesClose = () => {
    onEventsUpdate();
    setBulkIssueFinesOpen(false);
    setSelectedEvent(null);
  }
  
    const handleOpenChange = (open: boolean) => {
    if (!open) return;
    }

  // Executes after the user confirms
  const handleConfirm = async () => {
    if (!pendingAction) return;
    const { type, event } = pendingAction;

    setIsSubmitting(true);

    try {
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
      } else if (type === "markAsCompleted") {
        await completeEvent(event.id.toString());
        toast.success(`"${event.name}" has been completed.`);
        onEventsUpdate();
      }else if (type === "unarchive") {
        // TODO: Implement unarchiveEvent in firebase.ts and call it here
        toast.success(`"${event.name}" has been unarchived.`);
        onEventsUpdate();
      }
      setPendingAction(null);
    }
    catch (error) {
      console.error(`Failed to ${type} event:`, error);
      toast.error(`Failed to ${type} "${event.name}". Please try again.`);
    }
    finally {
      setIsSubmitting(false);
    }


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
    markAsCompleted: {
      title: "Mark this event as completed?",
      description: `"${pendingAction?.event.name}" will be marked as completed and moved to the completed events section.`,
      confirmLabel: "Mark as Completed",
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
    // A search or date filter that matches nothing is a different problem from
    // a term that simply has no events - saying "adjust your filters" when no
    // filter is active sends people looking for a filter that isn't there.
    const suggestion = isFiltered ? null : newestOtherTerm(all, selected);

    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-xl bg-muted/30">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          {isFiltered ? (
            <SearchXIcon className="w-8 h-8 text-muted-foreground" />
          ) : (
            <CalendarIcon className="w-8 h-8 text-muted-foreground" />
          )}
        </div>

        {isFiltered ? (
          <>
            <h3 className="text-base font-semibold text-foreground mb-1">
              No events found
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Nothing matches your current search or date filter in{" "}
              {formatTerm(selected)}. Try clearing them.
            </p>
          </>
        ) : (
          <>
            <h3 className="text-base font-semibold text-foreground mb-1">
              No events this term
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              There are no{statusLabel ? ` ${statusLabel}` : ""} events for{" "}
              {formatTerm(selected)}. Use the academic term selector to view an
              earlier term.
            </p>
            {suggestion && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setSelected(suggestion)}
              >
                View {formatTerm(suggestion)}
              </Button>
            )}
          </>
        )}
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
                onMarkAsCompleted={handleMarkAsCompletedClick}
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
                onMarkAsCompleted={handleMarkAsCompletedClick}
                onDelete={handleDeleteClick}
              />
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={!!pendingAction} onOpenChange={(open) => !open && !isSubmitting && handleCancelConfirm()}>
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
              onClick={(e) => {
                e.preventDefault(); //prevent dialog from closing immediately
                handleConfirm();
              }}
              disabled={isSubmitting}
              className={`gap-1.5 ${pendingAction?.type === "delete" ? "bg-destructive hover:bg-destructive/90" : ""}`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{pendingAction ? confirmContent[pendingAction.type].confirmLabel : "Confirm"}</span>
              )}
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
        onOpenChange={handleOpenChange}
        onClose={handleBulkIssueFinesClose}
        event={selectedEvent}
        />
      )}
    </>
  );
}