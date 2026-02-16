/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { MemberData, Program, Faculty } from "../types";
import { getFaculties, getProgramByFacultyId, getPrograms } from "@/firebase";
import { getPaginatedUsers } from "@/firebase/members";
import { toast } from "sonner";
import {
  getCacheKey,
  getStaticCache,
  isStaticCacheValid,
  updateStaticCache,
  getMembersCacheEntry,
  updateMembersCache,
  clearMembersCache,
  getCacheStatus,
} from "../services/membersCache";

export function usePaginatedMembers() {
  // Members display state
  const [members, setMembers] = useState<MemberData[]>([]);
  const [faculties, setFaculties] = useState(getStaticCache().faculties || []);
  const [programs, setPrograms] = useState(getStaticCache().programs || []);
  const [isLoading, setIsLoading] = useState(true);
  const [totalMembers, setTotalMembers] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dataSource, setDataSource] = useState<"cache" | "server">("server");

  // For search functionality
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<MemberData[]>([]);

  // Constants for pagination
  const ITEMS_PER_PAGE_CARD = 12;
  const ITEMS_PER_PAGE_TABLE = 10;

  // References for search debouncing
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get current page size based on view mode
  const getPageSize = useCallback(() => {
    return viewMode === "card" ? ITEMS_PER_PAGE_CARD : ITEMS_PER_PAGE_TABLE;
  }, [viewMode]);

  // Current cache key based on query parameters
  const cacheKey = useMemo(() => {
    return getCacheKey({
      page: currentPage,
      pageSize: getPageSize(),
      programFilter,
      searchQuery,
      sortBy,
    });
  }, [currentPage, getPageSize, programFilter, searchQuery, sortBy]);

  // Cache status for UI indicators
  const cacheStatus = useMemo(() => {
    return getCacheStatus(cacheKey);
  }, [cacheKey]);

  // Load static data (faculties and programs) with caching
  const loadStaticData = useCallback(async (forceRefresh = false) => {
    // Check if we have valid cached data and aren't forcing a refresh
    if (!forceRefresh && isStaticCacheValid()) {
      const { faculties: cachedFaculties, programs: cachedPrograms } =
        getStaticCache();
      const programs = await getPrograms() as Program[];
      // this is where the program is returned as NULL
      setFaculties(cachedFaculties || []);
      setPrograms(programs);
      return;
    }

    try {
      const [rawFaculties, rawPrograms] = await Promise.all([
        getFaculties(),
        getPrograms(),
      ]);
      // Ensure we have all required fields with proper type checking
      const typedFaculties: Faculty[] = Array.isArray(rawFaculties)
        ? rawFaculties.map((item: any) => ({
            id: item.id || "",
            name: item.name || `Faculty ${item.id || "Unknown"}`,
            code: item.code || "",
          }))
        : [];

      const typedPrograms: Program[] = Array.isArray(rawPrograms)
        ? rawPrograms.map((item: any) => ({
            id: item.id || "",
            name: item.name || `Program ${item.id || "Unknown"}`,
            code: item.code || "",
          }))
        : [];

      // Update the cache with the properly typed data
      updateStaticCache(typedFaculties, typedPrograms);

      // Update component state
      setFaculties(typedFaculties);
      setPrograms(typedPrograms);
    } catch (error) {
      console.error("Failed to fetch static data", error);
      toast.error("Failed to load program data");
    }
  }, []);

  // Load members with server-side pagination and caching
  const loadMembers = useCallback(
    async (forceRefresh = false) => {
      // First check if we have valid cached data
      if (!forceRefresh && !isSearchActive) {
        const cachedData = getMembersCacheEntry(cacheKey);
        if (cachedData) {
          setMembers(cachedData.members);
          setTotalMembers(cachedData.totalMembers);
          setDataSource("cache");
          setIsLoading(false);
          setIsRefreshing(false);
          return;
        }
      }

      // No valid cache, fetch from server
      setIsLoading(true);
      setDataSource("server");

      try {
        // Always fetch from server with current filters
        const result = await getPaginatedUsers({
          page: currentPage,
          pageSize: getPageSize(),
          searchQuery: searchQuery,
          programId: programFilter,
          sortBy: sortBy,
        });

        // Transform members data
        const transformedMembers = result.members.map((m: any) => ({
          id: m.id,
          member: {
            firstName: m.member.firstName ?? "",
            lastName: m.member.lastName ?? "",
            programId: m.member.programId ?? "",
            facultyId: m.member.facultyId ?? "",
            studentId: m.member.studentId ?? "",
            email: m.member.email ?? "",
            role: m.member.role ?? "user",
            createdAt: m.member.createdAt ?? undefined,
            yearLevel: m.member.yearLevel ?? undefined,
          },
        })) as MemberData[];

        // Update state
        setMembers(transformedMembers);
        setTotalMembers(result.total);
        // Cache the results (only if not searching)
        if (!isSearchActive) {
          updateMembersCache(cacheKey, transformedMembers, result.total);
        }
      } catch (error) {
        console.error("Failed to fetch members", error);
        toast.error("Failed to load member data. Please try again.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [
      cacheKey,
      currentPage,
      getPageSize,
      isSearchActive,
      programFilter,
      searchQuery,
      sortBy,
    ]
  );

  // Handle search with debouncing (for filters)
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);

      // Clear any existing timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Set a new timeout to delay the search execution
      searchTimeoutRef.current = setTimeout(() => {
        setCurrentPage(1); // Reset to first page
        loadMembers(); // Load with new search query
      }, 300); // 300ms debounce
    },
    [loadMembers]
  );

  // Handle program filter changes
  const handleProgramFilter = useCallback(
    (programId: string) => {
      setProgramFilter(programId);
      setCurrentPage(1); // Reset to first page
      loadMembers(true); // Force refresh with new filter
    },
    [loadMembers]
  );

  // Handle sort changes
  const handleSortBy = useCallback(
    (newSortBy: string) => {
      setSortBy(newSortBy);
      loadMembers(true); // Force refresh with new sort
    },
    [loadMembers]
  );

  // Handle page changes
  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      loadMembers(); // Try to use cache first
    },
    [loadMembers]
  );

  // Handle view mode changes
  const handleViewModeChange = useCallback(
    (mode: "card" | "table") => {
      setViewMode(mode);
      localStorage.setItem("membersViewMode", mode);
      // Reset to page 1 when changing view mode since page sizes differ
      setCurrentPage(1);
      loadMembers(); // Try to use cache first
    },
    [loadMembers]
  );

  // Manual refresh - reload data
  const refreshData = useCallback(() => {
    setIsRefreshing(true);

    // Load static data first, then members
    loadStaticData(true).then(() => {
      loadMembers(true); // Force refresh from server
    });
  }, [loadMembers, loadStaticData]);

  // Clear all caches (for debugging or troubleshooting)
  const clearCache = useCallback(() => {
    clearMembersCache();
    toast.success("Cache cleared");
    loadMembers(true); // Force refresh from server
  }, [loadMembers]);

  // Dedicated search function (for header search)
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setIsSearchActive(false);
      return;
    }

    setIsSearchActive(true);
    setIsSearching(true);

    try {
      // Always perform a server-side search
      const result = await getPaginatedUsers({
        page: 1,
        pageSize: 50, // Limit search results to prevent loading too many
        searchQuery: query,
        sortBy: "name-asc",
      });

      // Transform to correct type
      const typedResults = result.members.map((m: any) => ({
        id: m.id,
        member: {
          firstName: m.member.firstName ?? "",
          lastName: m.member.lastName ?? "",
          programId: m.member.programId ?? "",
          facultyId: m.member.facultyId ?? "",
          studentId: m.member.studentId ?? "",
          email: m.member.email ?? "",
          role: m.member.role ?? "user",
          createdAt: m.member.createdAt ?? undefined,
          yearLevel: m.member.yearLevel ?? undefined,
        },
      })) as MemberData[];

      setSearchResults(typedResults);
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("Search failed. Please try again.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setIsSearchActive(false);
    setSearchResults([]);
    setSearchQuery("");
    loadMembers(); // Reload the regular view
  }, [loadMembers]);

  // Load initial data
  useEffect(() => {
    // Load saved view mode from localStorage
    const savedViewMode = localStorage.getItem("membersViewMode") as
      | "card"
      | "table";
    if (
      savedViewMode &&
      (savedViewMode === "card" || savedViewMode === "table")
    ) {
      setViewMode(savedViewMode);
    }

    // Initial load - cascade loading to ensure proper order
    const initialLoad = async () => {
      await loadStaticData(false);
      await loadMembers(false);
    };

    initialLoad();

    // Cleanup function for debounce timers
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [loadMembers, loadStaticData]);

  //   useEffect(() => {
  //     // Listen for cache invalidation events from other tabs
  //     const handleStorageEvent = (event: StorageEvent) => {
  //       if (event.key === "members-cache-invalidation") {
  //         // Only refresh if we're not already loading or refreshing
  //         if (!isLoading && !isRefreshing) {
  //           refreshData();
  //         }
  //       }
  //     };

  //     window.addEventListener("storage", handleStorageEvent);
  //     return () => window.removeEventListener("storage", handleStorageEvent);
  //   }, [isLoading, isRefreshing, refreshData]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalMembers / getPageSize()));
  }, [totalMembers, getPageSize]);

  return {
    // Data
    members,
    faculties,
    programs,
    totalMembers,
    totalPages,
    currentPage,
    searchQuery,
    programFilter,
    sortBy,
    viewMode,
    searchResults,

    // State
    isLoading,
    isRefreshing,
    isSearchActive,
    isSearching,
    dataSource,
    cacheStatus,

    // Actions
    handleSearch,
    handleProgramFilter,
    handleSortBy,
    handlePageChange,
    handleViewModeChange,
    refreshData,
    performSearch,
    clearSearch,
    clearCache,
  };
}
