import { useState, useEffect, useCallback, useRef } from "react";
import { Event } from "../types";
import { getPaginatedEvents, getEvents } from "@/firebase";
import { EventStatus } from "../components/EventsTabNavigation";
import { cacheService, CACHE_DURATIONS } from "@/services/cacheService";

interface SortOptions {
  field: string;
  direction: "asc" | "desc";
}

export function useEventsData(currentTab: EventStatus) {
  const [events, setEvents] = useState<Event[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [sortOptions, setSortOptions] = useState<SortOptions>({
    field: "date",
    direction: "desc",
  });

  // Use a ref to track whether we've already loaded the search cache
  const searchCacheLoadedRef = useRef(false);
  const [cachedAllEvents, setCachedAllEvents] = useState<Event[]>([]);

  // Convert sort option string to field and direction
  const convertSortOption = (sortOption: string): SortOptions => {
    switch (sortOption) {
      case "date-asc":
        return { field: "date", direction: "asc" };
      case "date-desc":
        return { field: "date", direction: "desc" };
      case "name-asc":
        return { field: "name", direction: "asc" };
      case "name-desc":
        return { field: "name", direction: "desc" };
      case "attendees-asc":
        return { field: "attendees", direction: "asc" };
      case "attendees-desc":
        return { field: "attendees", direction: "desc" };
      default:
        return { field: "date", direction: "desc" };
    }
  };

  // Load search cache only when search is actually used
  const ensureSearchCache = useCallback(async () => {
    if (!searchCacheLoadedRef.current) {
      // Check if we already have events in the client-side cache
      const cacheKey = "events:client-cache:all";
      const cachedEvents = cacheService.get<Event[]>(cacheKey);

      if (cachedEvents?.data) {
        setCachedAllEvents(cachedEvents.data);
      } else {
        try {
          // Fetch all events and cache them for future searches
          const allEvents = await getEvents();
          setCachedAllEvents(allEvents);

          // Store in cache for future use
          cacheService.set(cacheKey, allEvents, CACHE_DURATIONS.EVENTS);
        } catch (error) {
          console.error("Error fetching events for search:", error);
        }
      }

      searchCacheLoadedRef.current = true;
    }
  }, []);

  // Create a cache key for the current view
  const createViewCacheKey = useCallback(() => {
    const dateStr = filterDate
      ? filterDate.toISOString().split("T")[0]
      : "no-date";
    return `ui:events:view:${currentTab}:${sortOptions.field}-${
      sortOptions.direction
    }:page${currentPage}:date${dateStr}:search${
      searchQuery ? "true" : "false"
    }`;
  }, [currentTab, sortOptions, currentPage, filterDate, searchQuery]);

  // Fetch events - separate logic for search vs. normal tab view
  const fetchEvents = useCallback(async () => {
    setLoading(true);

    try {
      // If this is a search query, ensure we have the search cache loaded
      if (searchQuery) {
        await ensureSearchCache();
      }

      // Use a client-side caching approach for the current view
      const viewCacheKey = createViewCacheKey();

      // Check if we have a fresh client-side UI cache for the current view
      const cachedViewData = await cacheService.getOrFetch(
        viewCacheKey,
        async () => {
          if (searchQuery) {
            // For search, filter the cached all events array client-side
            let filteredEvents = cachedAllEvents.filter(
              (event) =>
                event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                event.location.toLowerCase().includes(searchQuery.toLowerCase())
            );

            // Apply date filter if set
            if (filterDate) {
              const dateString = filterDate.toISOString().split("T")[0];
              filteredEvents = filteredEvents.filter((event) => {
                const eventDate = new Date(event.date);
                return eventDate.toISOString().split("T")[0] === dateString;
              });
            }

            // Apply status filter based on currentTab
            if (currentTab !== "all") {
              filteredEvents = filteredEvents.filter(
                (event) => event.status === currentTab
              );
            }

            // Sort events client-side
            filteredEvents.sort((a, b) => {
              if (sortOptions.field === "date") {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                return sortOptions.direction === "asc"
                  ? dateA - dateB
                  : dateB - dateA;
              } else if (sortOptions.field === "name") {
                return sortOptions.direction === "asc"
                  ? a.name.localeCompare(b.name)
                  : b.name.localeCompare(a.name);
              } else if (sortOptions.field === "attendees") {
                return sortOptions.direction === "asc"
                  ? a.attendees - b.attendees
                  : b.attendees - a.attendees;
              }
              return 0;
            });

            return {
              events: filteredEvents,
              totalCount: filteredEvents.length,
            };
          } else {
            // For normal tab view, use server-side pagination with our cached API
            const skip = (currentPage - 1) * itemsPerPage;

            const result = await getPaginatedEvents(
              currentTab,
              sortOptions.field,
              sortOptions.direction,
              itemsPerPage,
              null, // No cursor-based pagination
              undefined, // No search
              skip,
              filterDate
            );

            return {
              events: result.events,
              totalCount: result.totalCount,
            };
          }
        },
        CACHE_DURATIONS.UI_STATE // Use consistent TTL from cache durations
      );

      // Now we can safely access properties of the resolved Promise
      setEvents(cachedViewData.events);
      setTotalEvents(cachedViewData.totalCount);
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([]);
      setTotalEvents(0);
    } finally {
      setLoading(false);
    }
  }, [
    currentTab,
    searchQuery,
    sortOptions,
    itemsPerPage,
    currentPage,
    filterDate,
    cachedAllEvents,
    createViewCacheKey,
    ensureSearchCache,
  ]);

  // Handle page change - only for tab view, not search
  const handlePageChange = useCallback((page: number) => {
    // Update the current page
    setCurrentPage(page);
  }, []);

  // Handle date filter change
  const handleDateChange = useCallback((date: Date | undefined) => {
    setFilterDate(date);
    setCurrentPage(1); // Reset to first page when filter changes
  }, []);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when search changes
  }, []);

  // Handle sorting
  const handleSort = useCallback((sortOption: string) => {
    setSortOptions(convertSortOption(sortOption));
    setCurrentPage(1); // Reset to first page when sort changes
  }, []);

  // Fetch events when dependencies change
  useEffect(() => {
    fetchEvents();
  }, [
    fetchEvents,
    currentPage,
    currentTab,
    sortOptions.field,
    sortOptions.direction,
    searchQuery,
    filterDate,
  ]);

  // Reset page when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [currentTab]);

  return {
    events,
    totalEvents,
    loading,
    currentPage,
    totalPages: Math.ceil(totalEvents / itemsPerPage),
    handlePageChange,
    handleSearch,
    handleSort,
    handleDateChange,
    searchQuery,
    refresh: fetchEvents, // Expose refresh function
  };
}
