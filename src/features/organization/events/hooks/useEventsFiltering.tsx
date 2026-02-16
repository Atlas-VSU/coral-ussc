import { useState, useCallback, useMemo } from "react";
import { Event } from "../types";

export function useEventsFiltering(
  allEvents: Event[],
  eventsData: Event[],
  isSearchActive: boolean
) {
  const [searchQuery, setSearchQuery] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>("date-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Filter events based on search query and date
  const filteredEvents = useMemo(() => {
    // Determine which dataset to use: all events when searching, or tab-specific events
    const dataSource = isSearchActive ? allEvents : eventsData;

    return dataSource.filter((event) => {
      const searchMatch =
        !searchQuery ||
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase());

      const dateMatch =
        !date || new Date(event.date).toDateString() === date.toDateString();

      return searchMatch && dateMatch;
    });
  }, [allEvents, eventsData, isSearchActive, searchQuery, date]);

  // Sort filtered events
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "date-desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "attendees-asc":
          return a.attendees - b.attendees;
        case "attendees-desc":
          return b.attendees - a.attendees;
        default:
          return 0;
      }
    });
  }, [filteredEvents, sortBy]);

  // Calculate pagination
  const paginatedEvents = useMemo(() => {
    return sortedEvents.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [sortedEvents, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedEvents.length / itemsPerPage);

  // Handle search query changes
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const setDateFilter = useCallback((newDate: Date | undefined) => {
    setDate(newDate);
    setCurrentPage(1);
  }, []);

  const setSortByFilter = useCallback((newSortBy: string) => {
    setSortBy(newSortBy);
    setCurrentPage(1);
  }, []);

  return {
    searchQuery,
    date,
    sortBy,
    currentPage,
    handleSearch,
    setDateFilter,
    setSortByFilter,
    setCurrentPage,
    filteredEvents,
    sortedEvents,
    paginatedEvents,
    totalPages,
  };
}
