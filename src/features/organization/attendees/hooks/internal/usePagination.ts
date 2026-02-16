import { useState, useCallback } from "react";
import { DocumentSnapshot } from "firebase/firestore";
import { SearchParams } from "../../types";

// const PAGE_SIZE = 10;

type SortOption = {
  field: string;
  direction: "asc" | "desc";
};

// Store cursors in memory between page navigations
const cursorStorage = new Map<
  string,
  {
    cursors: (DocumentSnapshot | null)[];
    totalPages: number;
    lastUpdated: number;
  }
>();

export const usePagination = (
  eventId: string,
  sortOption: SortOption,
  programFilter: string | null,
  searchQuery: SearchParams | null
) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [directPageJump, setDirectPageJump] = useState<number | null>(null);

  // Create a key for the current filter set
  const getFilterKey = useCallback(() => {
    return `${eventId}:${sortOption.field}-${sortOption.direction}:${
      programFilter || "all"
    }:${searchQuery?.type || "none"}-${searchQuery?.query || "none"}`;
  }, [eventId, sortOption, programFilter, searchQuery]);

  // Get cursor storage with expiration check
  const getCursorStorage = useCallback(() => {
    const key = getFilterKey();
    const storage = cursorStorage.get(key);

    // Check if storage exists and is still valid (less than 30 minutes old)
    if (storage && Date.now() - storage.lastUpdated < 30 * 60 * 1000) {
      return storage;
    }

    // Initialize new storage
    const newStorage = {
      cursors: [null],
      totalPages: 1,
      lastUpdated: Date.now(),
    };
    cursorStorage.set(key, newStorage);
    return newStorage;
  }, [getFilterKey]);

  // Initialize cursors from storage or create new array
  const getCursors = useCallback(() => {
    return getCursorStorage().cursors;
  }, [getCursorStorage]);

  // Set cursors with timestamp
  const setCursors = useCallback(
    (value: (DocumentSnapshot | null)[]) => {
      const storage = getCursorStorage();
      storage.cursors = value;
      storage.lastUpdated = Date.now();
    },
    [getCursorStorage]
  );

  // Reset pagination when filters change
  const resetPagination = useCallback(() => {
    setCurrentPage(1);
    setCursors([null]);
  }, [setCursors]);

  // Handle page navigation
  const handlePageChange = useCallback(
    (direction: "next" | "prev") => {
      const cursors = getCursors();
      if (direction === "next" && currentPage < cursors.length) {
        setCurrentPage((prev) => prev + 1);
      } else if (direction === "prev" && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
    },
    [currentPage, getCursors]
  );

  // Go to a specific page
  const goToSpecificPage = useCallback(
    (page: number) => {
      const cursors = getCursors();
      const storage = getCursorStorage();

      // Don't do anything if the page is invalid
      if (page < 1 || page > storage.totalPages) {
        return;
      }

      // If we already have the cursor for this page, just navigate to it
      if (page <= cursors.length) {
        setCurrentPage(page);
        return;
      }

      // Otherwise, mark this as a direct page jump
      setDirectPageJump(page);
      setCurrentPage(page);
    },
    [getCursors, getCursorStorage]
  );

  return {
    currentPage,
    totalPages,
    setTotalPages,
    directPageJump,
    setDirectPageJump,
    getFilterKey,
    getCursorStorage,
    getCursors,
    setCursors,
    resetPagination,
    goToSpecificPage,
    handlePageChange,
  };
};
