"use client";

import { useCallback, useMemo, useState } from "react";
import { SelfRegistration } from "../data/mockSelfRegistrations";

/**
 * Provides client-side search, program-filter, and sort controls for the
 * self-registrations list returned by the real-time `useSelfRegistrations` hook.
 *
 * All filtering/sorting is done in-memory — the source list is already small
 * (only pending students) and is kept live via `onSnapshot`. There is no need
 * for server-side pagination here.
 *
 * Usage:
 * ```tsx
 * const { filtered, ...filterProps } = useSelfRegFilters(registrations);
 * <MembersFilters programs={programs} {...filterProps} />
 * ```
 */
export function useSelfRegFilters(registrations: SelfRegistration[]) {
  const [searchInput, setSearchInput] = useState("");
  const [committedSearch, setCommittedSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [viewMode, setViewMode] = useState<"card" | "table">("grid" as any);

  // ─── Search handlers (Enter-only commit, same pattern as usePaginatedMembers) ──
  const handleSearchInputChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  const handleSearchCommit = useCallback(() => {
    setCommittedSearch(searchInput.trim());
  }, [searchInput]);

  const handleSearchClear = useCallback(() => {
    setSearchInput("");
    setCommittedSearch("");
  }, []);

  const handleProgramFilter = useCallback((programId: string) => {
    setProgramFilter(programId);
  }, []);

  const handleSortBy = useCallback((value: string) => {
    setSortBy(value);
  }, []);

  const handleViewModeChange = useCallback((mode: "card" | "table") => {
    setViewMode(mode);
  }, []);

  // ─── Derived: filtered + sorted list ────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = [...registrations];

    // Text search (name, student ID, email)
    if (committedSearch) {
      const lower = committedSearch.toLowerCase();
      result = result.filter(
        (r) =>
          r.firstName.toLowerCase().includes(lower) ||
          r.lastName.toLowerCase().includes(lower) ||
          r.studentId.toLowerCase().includes(lower) ||
          r.email.toLowerCase().includes(lower)
      );
    }

    // Program filter — matches against programName since self-reg records
    // carry the name string, not a programId FK.
    if (programFilter !== "all") {
      result = result.filter((r) => r.programName === programFilter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.firstName.localeCompare(b.firstName);
        case "name-desc":
          return b.firstName.localeCompare(a.firstName);
        case "id-asc":
          return a.studentId.localeCompare(b.studentId);
        case "id-desc":
          return b.studentId.localeCompare(a.studentId);
        case "date-asc":
          return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        case "date-desc":
        default:
          return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      }
    });

    return result;
  }, [registrations, committedSearch, programFilter, sortBy]);

  return {
    /** Filtered + sorted list ready to render */
    filtered,

    // Filter state (pass directly to MembersFilters)
    searchTerm: searchInput,
    programFilter,
    viewMode,

    // Handlers (pass directly to MembersFilters)
    onSearchChange: handleSearchInputChange,
    onSearchCommit: handleSearchCommit,
    onSearchClear: handleSearchClear,
    onProgramFilter: handleProgramFilter,
    onSortBy: handleSortBy,
    onViewChange: handleViewModeChange,
  };
}
