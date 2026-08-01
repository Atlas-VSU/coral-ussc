import { useState, useEffect, useCallback, useRef } from "react";
import { Event } from "../types";
import { getPaginatedEvents, getEvents } from "@/firebase";
import { EventStatus } from "../types";
import { cacheService, CACHE_DURATIONS } from "@/services/cacheService";
import { useTermPeriod } from "../../term/hooks/useTermPeriod";

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

  const { selected } = useTermPeriod()

  const searchCacheLoadedRef = useRef(false);
  // Keep a ref copy so fetchEvents can always read the latest value
  // without causing stale-closure bugs
  const cachedAllEventsRef = useRef<Event[]>([]);
  const [, setCachedAllEvents] = useState<Event[]>([]);

  const convertSortOption = (sortOption: string): SortOptions => {
    switch (sortOption) {
      case "date-asc":   return { field: "date",      direction: "asc"  };
      case "date-desc":  return { field: "date",      direction: "desc" };
      case "name-asc":   return { field: "name",      direction: "asc"  };
      case "name-desc":  return { field: "name",      direction: "desc" };
      case "attendees-asc":  return { field: "attendees", direction: "asc"  };
      case "attendees-desc": return { field: "attendees", direction: "desc" };
      default:           return { field: "date",      direction: "desc" };
    }
  };

  // Returns the full event list (from cache or network) directly instead of
  // relying on a state update that would only be visible next render.
  const ensureSearchCache = useCallback(async (): Promise<Event[]> => {
    if (searchCacheLoadedRef.current) {
      return cachedAllEventsRef.current;
    }

    const cacheKey = `events:client-cache:all:${selected?.AY}-${selected?.semester}`;
    const cachedEvents = cacheService.get<Event[]>(cacheKey);

    let allEvents: Event[];
    if (cachedEvents?.data) {
      allEvents = cachedEvents.data;
    } else {
      try {
        allEvents = await getEvents(undefined, selected);
        cacheService.set(cacheKey, allEvents, CACHE_DURATIONS.EVENTS);
      } catch (error) {
        console.error("Error fetching events for search:", error);
        allEvents = [];
      }
    }

    cachedAllEventsRef.current = allEvents;
    setCachedAllEvents(allEvents); // keep state in sync for anything that reads it
    searchCacheLoadedRef.current = true;
    return allEvents;
  }, []);

  const createViewCacheKey = useCallback(() => {
    const dateStr = filterDate
      ? filterDate.toISOString().split("T")[0]
      : "no-date";
    const searchKey = searchQuery
      ? `q:${searchQuery.toLowerCase().trim()}`
      : "no-search";
    return `ui:events:view:${currentTab}:${sortOptions.field}-${
      sortOptions.direction
    }:page${currentPage}:date${dateStr}:${searchKey}:term${selected?.AY}-${selected?.semester}`;
  }, [currentTab, sortOptions, currentPage, filterDate, searchQuery, selected]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);

    try {
      const viewCacheKey = createViewCacheKey();

      const cachedViewData = await cacheService.getOrFetch(
        viewCacheKey,
        async () => {
          if (searchQuery) {
            // Await the result directly — no stale-state problem
            const allEvents = await ensureSearchCache();

            let filteredEvents = allEvents.filter(
              (event) =>
                event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                event.location.toLowerCase().includes(searchQuery.toLowerCase())
            );

            if (filterDate) {
              const dateString = filterDate.toISOString().split("T")[0];
              filteredEvents = filteredEvents.filter((event) => {
                const eventDate = new Date(event.date);
                return eventDate.toISOString().split("T")[0] === dateString;
              });
            }

            if (currentTab !== "all") {
              filteredEvents = filteredEvents.filter(
                (event) => event.status === currentTab
              );
            }

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
            const skip = (currentPage - 1) * itemsPerPage;
            const result = await getPaginatedEvents(
              currentTab,
              sortOptions.field,
              sortOptions.direction,
              itemsPerPage,
              null,
              undefined,
              skip,
              filterDate,
              selected
            );
            return {
              events: result.events,
              totalCount: result.totalCount,
            };
          }
        },
        CACHE_DURATIONS.UI_STATE
      );
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
    selected,
    createViewCacheKey,
    ensureSearchCache,
  ]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleDateChange = useCallback((date: Date | undefined) => {
    setFilterDate(date);
    setCurrentPage(1);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    // Bust all stale view-cache entries (old keys used "searchtrue/false")
    cacheService.invalidateByPrefix("ui:events:view:");
    // Force re-fetch of the full events list for search
    searchCacheLoadedRef.current = false;
  }, []);

  const handleSort = useCallback((sortOption: string) => {
    setSortOptions(convertSortOption(sortOption));
    setCurrentPage(1);
  }, []);

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
    selected
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [currentTab]);

  return {
    events,
    totalEvents,
    loading,
    currentPage,
    totalPages: Math.ceil(totalEvents / itemsPerPage),
    AY: selected?.AY!,
    sem: selected?.semester!,
    handlePageChange,
    handleSearch,
    handleSort,
    handleDateChange,
    searchQuery,
    refresh: fetchEvents,
  };
}