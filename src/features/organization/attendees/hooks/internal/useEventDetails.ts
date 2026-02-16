import { useState, useEffect, useCallback } from "react";
import { getEventById } from "@/firebase";
import { Event } from "../../../events/types";
import { cacheService, CACHE_DURATIONS } from "@/services/cacheService";

export const useEventDetails = (eventId: string) => {
  const [eventData, setEventData] = useState<Event>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch event details with caching
  const fetchEventDetails = useCallback(
    async (forceRefresh = false) => {
      if (!eventId) return;
      setLoading(true);

      const cacheKey = `event:${eventId}`;

      try {
        let event;

        if (forceRefresh) {
          // Skip cache on force refresh
          event = (await getEventById(eventId)) as Event;
          cacheService.set(cacheKey, event, CACHE_DURATIONS.EVENTS);
        } else {
          // Try to get from cache first
          event = await cacheService.getOrFetch<Event>(
            cacheKey,
            async () => (await getEventById(eventId)) as Event,
            CACHE_DURATIONS.EVENTS
          );
        }

        setEventData(event);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    },
    [eventId]
  );

  // Load data on mount
  useEffect(() => {
    fetchEventDetails();
  }, [fetchEventDetails]);

  return {
    eventData,
    loading,
    error,
    refreshEventDetails: () => fetchEventDetails(true),
  };
};
