import { cacheService } from "@/services/cacheService";
import { Event } from "../types";

export const eventsCacheService = {
  /**
   * Invalidate all events-related caches when the events list changes
   * (e.g., after create, update, delete)
   */
  invalidateEventsCache: () => {
    // Clear all events caches in firebase
    cacheService.invalidateByPrefix("events:");

    // Clear UI event views
    cacheService.invalidateByPrefix("ui:events:");

    // Clear dashboard caches that might contain event data
    cacheService.invalidateByPrefix("dashboard:upcoming-events");
    cacheService.invalidateByPrefix("dashboard:ongoing-events");
  },

  /**
   * Store events list in client-side cache for quick access
   * during search operations
   */
  cacheAllEvents: (events: Event[]) => {
    cacheService.set("events:client-cache:all", events, 5 * 60 * 1000); // 5 minutes
  },

  /**
   * Get cached events list for client-side operations
   */
  getCachedAllEvents: (): Event[] | null => {
    const cachedEvents = cacheService.get<Event[]>("events:client-cache:all");
    return cachedEvents?.data || null;
  },

  /**
   * Invalidate cached data for a specific event
   */
  invalidateEventCache: (eventId: string) => {
    cacheService.invalidate(`event:${eventId}`);
  },

  /**
   * Invalidate UI state for a specific tab/filter combination
   */
  invalidateUICache: (
    tab: string,
    sortField: string,
    sortDirection: string
  ) => {
    cacheService.invalidateByPrefix(
      `ui:events:view:${tab}:${sortField}-${sortDirection}`
    );
  },
};

// Export these constants to use in the events service
export const CACHE_KEYS = {
  ALL_EVENTS: "events:client-cache:all",
  EVENT_DETAILS: (id: string) => `event:${id}`,
  EVENTS_BY_STATUS: (status: string) => `events:status:${status}`,
  PAGINATED_EVENTS: (params: string) => `events:paginated:${params}`,
  UI_VIEW: (params: string) => `ui:events:view:${params}`,
};
