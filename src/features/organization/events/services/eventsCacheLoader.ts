import { useEffect } from "react";
import { getEvents } from "@/firebase";
import { cacheService, CACHE_DURATIONS } from "@/services/cacheService";

/**
 * This component preloads the events cache in the background
 * to improve search performance. It doesn't render anything visible.
 */
export function EventsCacheLoader() {
  // Load event cache in the background when component mounts
  useEffect(() => {
    const loadEventCache = async () => {
      const cacheKey = "events:client-cache:all";

      // Check if we already have a valid cache
      const cachedEvents = cacheService.get(cacheKey);
      if (cachedEvents) {
        // Cache already exists and is valid
        return;
      }

      try {
        // Load during idle time if possible
        if ("requestIdleCallback" in window) {
          window.requestIdleCallback(async () => {
            const events = await getEvents();
            cacheService.set(cacheKey, events, CACHE_DURATIONS.EVENTS);
          });
        } else {
          // Fallback for browsers without requestIdleCallback
          setTimeout(async () => {
            const events = await getEvents();
            cacheService.set(cacheKey, events, CACHE_DURATIONS.EVENTS);
          }, 2000); // Wait 2 seconds before loading
        }
      } catch (error) {
        console.error("Error preloading events cache:", error);
      }
    };

    loadEventCache();
  }, []);

  // This component doesn't render anything
  return null;
}
