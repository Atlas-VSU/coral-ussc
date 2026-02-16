import { useState, useEffect, useCallback } from "react";
import { DocumentSnapshot } from "firebase/firestore";
import { getAttendanceRecord } from "@/firebase";
import { EventAttendance } from "../../../log-attendance/types";
import { SearchParams } from "../../types";
import { cacheService, CACHE_DURATIONS } from "@/services/cacheService";

const PAGE_SIZE = 10;

type SortOption = {
  field: string;
  direction: "asc" | "desc";
};

export const useAttendeesList = (
  eventId: string,
  currentPage: number,
  directPageJump: number | null,
  searchQuery: SearchParams | null,
  sortOption: SortOption,
  programFilter: string | null,
  getCursors: () => (DocumentSnapshot | null)[],
  setCursors: (value: (DocumentSnapshot | null)[]) => void,
  getCursorStorage: () => {
    cursors: (DocumentSnapshot | null)[];
    totalPages: number;
    lastUpdated: number;
  },
  setTotalPages: (value: number) => void,
  setDirectPageJump: (value: number | null) => void
) => {
  const [attendees, setAttendees] = useState<EventAttendance[]>([]);
  const [totalAttendees, setTotalAttendees] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dataSource, setDataSource] = useState<"cache" | "server">("server");

  // Create a unique cache key for the current query parameters
  const createCacheKey = useCallback(() => {
    return `event-attendees:${eventId}:page${currentPage}:sort${
      sortOption.field
    }-${sortOption.direction}:program${programFilter || "all"}:search${
      searchQuery?.query || "none"
    }`;
  }, [eventId, currentPage, sortOption, programFilter, searchQuery]);

  // Fetch event attendees with caching
  const fetchAttendees = useCallback(
    async (forceRefresh = false) => {
      if (!eventId) return;
      setLoading(true);

      const cacheKey = createCacheKey();
      const cursors = getCursors();
      let cursorForCurrentPage = cursors[currentPage - 1];

      // Handle direct page jumps (e.g., from page 1 to 5)
      if (directPageJump !== null && directPageJump > cursors.length) {
        console.log(
          `🔄 Direct jump to page ${directPageJump} - need to fetch intermediate cursors`
        );

        try {
          // Calculate how many records we need to skip to get to the right page
          const recordsToSkip = (directPageJump - 1) * PAGE_SIZE;

          // Generate a special cache key for this larger fetch
          const jumpCacheKey = `event-attendees-jump:${eventId}:to-page${directPageJump}:${eventId}:${
            sortOption.field
          }-${sortOption.direction}:${programFilter || "all"}:${
            searchQuery?.type || "none"
          }-${searchQuery?.query || "none"}`;

          // Use a larger page size to fetch all records up to the desired page
          const jumpResult = await cacheService.getOrFetch(
            jumpCacheKey,
            async () => {
              setDataSource("server");

              // Get the first cursor we have (usually null for page 1)
              const firstCursor = cursors[0];

              // Fetch with larger limit to get to the page we want
              return getAttendanceRecord(
                eventId,
                recordsToSkip + PAGE_SIZE, // Get all records up to our target page
                sortOption,
                firstCursor || undefined,
                programFilter ?? undefined,
                searchQuery,
                true // Add a flag to indicate this is a page jump operation
              );
            },
            CACHE_DURATIONS.ATTENDANCE
          );

          // Process all intermediate cursors from the paginated result
          if (jumpResult.cursors && jumpResult.cursors.length > 0) {
            // Update our cursor storage with all intermediate cursors
            const newCursors = [...cursors];

            // Fill in any missing cursors
            while (newCursors.length < directPageJump) {
              newCursors.push(null);
            }

            // Update with the actual cursors we got
            for (
              let i = 0;
              i < jumpResult.cursors.length && i + 1 < directPageJump;
              i++
            ) {
              newCursors[i + 1] = jumpResult.cursors[i];
            }

            setCursors(newCursors);

            // Now we have the cursor we need
            cursorForCurrentPage = newCursors[directPageJump - 1];
          }

          // Update total from this larger query
          if (jumpResult.total) {
            setTotalAttendees(jumpResult.total);
            setTotalPages(Math.ceil(jumpResult.total / PAGE_SIZE));
          }

          // If we already have the records for the current page from the jump query,
          // use them instead of doing another query
          if (
            jumpResult.recordsForPage &&
            jumpResult.recordsForPage[directPageJump]
          ) {
            setAttendees(jumpResult.recordsForPage[directPageJump]);
            setLoading(false);
            setDirectPageJump(null);
            return;
          }
        } catch (err) {
          console.error("Error during page jump:", err);
          // Continue with normal fetch as fallback
        }
      }

      try {
        let result;

        if (forceRefresh) {
          // Skip cache on force refresh
          result = await getAttendanceRecord(
            eventId,
            PAGE_SIZE,
            sortOption,
            cursorForCurrentPage || undefined,
            programFilter ?? undefined,
            searchQuery
          );

          // Update cache with fresh data
          cacheService.set(cacheKey, result, CACHE_DURATIONS.ATTENDANCE);
          setDataSource("server");
        } else {
          // Try to get from cache first
          result = await cacheService.getOrFetch(
            cacheKey,
            async () => {
              setDataSource("server");
              return getAttendanceRecord(
                eventId,
                PAGE_SIZE,
                sortOption,
                cursorForCurrentPage || undefined,
                programFilter ?? undefined,
                searchQuery
              );
            },
            CACHE_DURATIONS.ATTENDANCE
          );
          setDataSource("cache");
        }

        setAttendees(result.records);
        setTotalAttendees(result.total);

        // Save the next cursor if we have one and need it
        if (result.nextCursor && cursors.length === currentPage) {
          const newCursors = [...cursors, result.nextCursor];
          setCursors(newCursors);
        }

        // Update total pages
        const totalPages = Math.ceil(result.total / PAGE_SIZE);
        setTotalPages(totalPages);

        // Reset direct page jump flag
        setDirectPageJump(null);
      } catch (err) {
        setError(err as Error);
        setDirectPageJump(null);
      } finally {
        setLoading(false);
      }
    },
    [
      eventId,
      currentPage,
      directPageJump,
      searchQuery,
      sortOption,
      programFilter,
      createCacheKey,
      getCursors,
      setCursors,
      setTotalPages,
      setDirectPageJump,
    ]
  );

  // Load data when dependencies change
  useEffect(() => {
    fetchAttendees();
  }, [fetchAttendees]);

  return {
    attendees,
    totalAttendees,
    loading,
    error,
    dataSource,
    refreshAttendees: () => fetchAttendees(true),
  };
};
