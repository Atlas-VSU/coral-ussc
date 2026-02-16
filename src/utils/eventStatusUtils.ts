import { Event } from "@/features/organization/events/types";

/**
 * Determines the status of an event based on its date
 */
export function determineEventStatus(
  eventDate: Date
): "upcoming" | "ongoing" | "completed" {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDay = new Date(
    eventDate.getFullYear(),
    eventDate.getMonth(),
    eventDate.getDate()
  );

  // If event date is in the future, it's upcoming
  if (eventDay > today) {
    return "upcoming";
  }

  // If event date is today, it's ongoing
  if (eventDay.getTime() === today.getTime()) {
    return "ongoing";
  }

  // If event date is in the past, it's completed
  return "completed";
}

/**
 * Checks if event statuses need to be updated
 * Returns array of events that need status updates
 */
export function getEventsNeedingStatusUpdate(events: Event[]): Event[] {
  return events.filter((event) => {
    // Skip archived events - they stay archived
    if (event.status === "archived") return false;

    const currentStatus = event.status;
    const correctStatus = determineEventStatus(new Date(event.date));

    return currentStatus !== correctStatus;
  });
}
