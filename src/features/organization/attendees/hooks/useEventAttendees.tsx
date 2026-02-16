/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEventDetails } from "./internal/useEventDetails";
import { useAttendeesList } from "./internal/useAttendeesList";
import { usePagination } from "./internal/usePagination";
import { useEventFilters } from "./internal/useEventFilters";
// import { SearchParams } from "../types";

// This is the main hook that combines all the other hooks
export const useEventAttendees = (eventId: string) => {
  // Get event details
  const {
    eventData,
    loading: eventLoading,
    error: eventError,
    refreshEventDetails,
  } = useEventDetails(eventId);

  // Manage filters and search
  const {
    searchQuery,
    sortOption,
    programFilter,
    handleSearch,
    handleSortChange,
    handleProgramFilter,
  } = useEventFilters();

  // Manage pagination state and cursors
  const {
    currentPage,
    totalPages,
    setTotalPages,
    directPageJump,
    setDirectPageJump,
    getCursorStorage,
    getCursors,
    setCursors,
    resetPagination, // We'll expose this in the return value
    goToSpecificPage,
    handlePageChange,
  } = usePagination(eventId, sortOption, programFilter, searchQuery);

  // Get attendees list with pagination and filtering
  const {
    attendees,
    totalAttendees,
    loading: attendeesLoading,
    error: attendeesError,
    dataSource,
    refreshAttendees,
  } = useAttendeesList(
    eventId,
    currentPage,
    directPageJump,
    searchQuery,
    sortOption,
    programFilter,
    getCursors,
    setCursors,
    getCursorStorage,
    setTotalPages,
    setDirectPageJump
  );

  // Modified handler to reset pagination when changing filters
  const handleFilterProgramChange = (program: string | undefined) => {
    handleProgramFilter(program);
    resetPagination(); // Reset pagination when filters change
  };

  const handleFilterSortChange = (value: string) => {
    handleSortChange(value);
    resetPagination(); // Reset pagination when sort changes
  };

  const handleFilterSearch = (query: any) => {
    handleSearch(query);
    resetPagination(); // Reset pagination when search changes
  };

  // Combine refresh functions
  const refreshData = () => {
    refreshEventDetails();
    refreshAttendees();
  };

  return {
    // Event data
    eventData,

    // Attendees data
    attendees,
    totalAttendees,
    totalPages,
    currentPage,

    // Loading and error states
    loading: eventLoading,
    attendeesLoading,
    error: eventError || attendeesError,
    dataSource,

    // Pagination actions
    goToNextPage: () => handlePageChange("next"),
    goToPrevPage: () => handlePageChange("prev"),
    goToSpecificPage,
    resetPagination, // Expose this for manual resets
    hasNextPage: currentPage < getCursorStorage().totalPages,
    hasPrevPage: currentPage > 1,

    // Filter/search actions - use the wrapped versions that reset pagination
    handleSearch: handleFilterSearch,
    handleSortChange: handleFilterSortChange,
    handleProgramFilter: handleFilterProgramChange,

    // Refresh action
    refreshData,
  };
};
