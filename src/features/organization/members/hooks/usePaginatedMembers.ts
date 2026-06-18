/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { MemberData, Program, Faculty } from "../types";
import { getFaculties, getPrograms } from "@/firebase";
import { getPaginatedUsers } from "@/firebase/members";
import { toast } from "sonner";
import {
  getStaticCache,
  isStaticCacheValid,
  updateStaticCache,
  getMembersCacheEntry,
  updateMembersCache,
  clearMembersCache,
} from "../services/membersCache";
import { getActiveTerm } from "@/firebase/term";
import { Term } from "@/constants/types";

const ITEMS_PER_PAGE_CARD = 12;
const ITEMS_PER_PAGE_TABLE = 10;

export function usePaginatedMembers() {
  // ─── Static data ──────────────────────────────────────────────────────────
  const [faculties, setFaculties] = useState<Faculty[]>(
    getStaticCache().faculties || []
  );
  const [programs, setPrograms] = useState<Program[]>(
    getStaticCache().programs || []
  );

  // ─── Members ──────────────────────────────────────────────────────────────
  const [members, setMembers] = useState<MemberData[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dataSource, setDataSource] = useState<"cache" | "server">("server");

  // ─── Filters & view ───────────────────────────────────────────────────────
  const [programFilter, setProgramFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [term, setTerm] = useState<Term>({AY:"", semester:"", isActive: true});

  // ─── Pagination (cursor-based, forward/backward only) ─────────────────────
  // cursorStack[0] = null (page 1 has no cursor)
  // cursorStack[N] = lastDoc from page N, used to fetch page N+1
  const [currentPage, setCurrentPage] = useState(1);
  const cursorStack = useRef<(QueryDocumentSnapshot<DocumentData> | null)[]>([null]);

  // ─── Search ───────────────────────────────────────────────────────────────
  // `committedSearch` is only updated on Enter — prevents mid-type fetches
  const [searchInput, setSearchInput] = useState("");
  const [committedSearch, setCommittedSearch] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const pageSize = viewMode === "card" ? ITEMS_PER_PAGE_CARD : ITEMS_PER_PAGE_TABLE;

  /** Reset cursor stack and page counter back to page 1. */
  const resetPagination = useCallback(() => {
    cursorStack.current = [null];
    setCurrentPage(1);
  }, []);

  // ─── Static data loader ───────────────────────────────────────────────────
  const loadStaticData = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && isStaticCacheValid()) {
      const { faculties: cf, programs: cp } = getStaticCache();
      setFaculties(cf || []);
      setPrograms(cp || []);
      return;
    }

    try {
      const [rawFaculties, rawPrograms] = await Promise.all([
        getFaculties(),
        getPrograms(),
      ]);

      const typedFaculties: Faculty[] = Array.isArray(rawFaculties)
        ? rawFaculties.map((item: any) => ({
            id: item.id || "",
            name: item.name || `Faculty ${item.id || "Unknown"}`,
            code: item.code || "",
            acronym: item.acronym || "",
          }))
        : [];

      const typedPrograms: Program[] = Array.isArray(rawPrograms)
        ? rawPrograms.map((item: any) => ({
            id: item.id || "",
            name: item.name || `Program ${item.id || "Unknown"}`,
            code: item.code || "",
            acronym: item.acronym || "",
            shortName: item.shortName || "",
          }))
        : [];

      updateStaticCache(typedFaculties, typedPrograms);
      setFaculties(typedFaculties);
      setPrograms(typedPrograms);
    } catch (error) {
      console.error("Failed to fetch static data", error);
      toast.error("Failed to load program data");
    }
  }, []);

  // ─── Core members loader ──────────────────────────────────────────────────
  /**
   * Single source of truth for fetching members.
   * Pass explicit params to avoid stale closure issues entirely.
   */
  const fetchMembers = useCallback(
    async (params: {
      page: number;
      pageSize: number;
      programFilter: string;
      sortBy: string;
      committedSearch: string;
      forceRefresh?: boolean;
      needCount?: boolean;
    }) => {
      const {
        page,
        pageSize,
        programFilter,
        sortBy,
        committedSearch,
        forceRefresh = false,
        needCount = false,
      } = params;

      const _term = await getActiveTerm();

      // Cursor for this page: stack index = page - 1
      const lastDoc = cursorStack.current[page - 1] ?? null;

      // Build a stable cache key (no cursor — cursor is positional)
      const cacheKey = `p${page}-ps${pageSize}-prog${programFilter}-sort${sortBy}-q${committedSearch}`;

      if (!forceRefresh) {
        const cached = getMembersCacheEntry(cacheKey);
        if (cached) {
          setMembers(cached.members);
          setTotalMembers(cached.totalMembers);
          setTerm(cached.term);
          setDataSource("cache");
          setIsLoading(false);
          setIsRefreshing(false);
          return;
        }
      }

      setIsLoading(true);
      setDataSource("server");

      try {
        const result = await getPaginatedUsers({
          pageSize,
          lastDoc,
          searchQuery: committedSearch,
          programId: programFilter,
          sortBy,
          needCount,
        });

        const transformedMembers: MemberData[] = result.members.map((m: any) => ({
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
        }));

        // Store the cursor for the NEXT page at stack position `page`
        // Only push if we got a full page (there's a next page to go to)
        if (result.lastDoc) {
          cursorStack.current[page] = result.lastDoc;
        }

        // If needCount was true, update total; otherwise keep existing total
        if (needCount) {
          setTotalMembers(result.total);
        }
        setTerm(_term!);
        setMembers(transformedMembers);
        updateMembersCache(cacheKey, transformedMembers, result.total, _term!);
      } catch (error) {
        console.error("Failed to fetch members", error);
        toast.error("Failed to load member data. Please try again.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [] // No state deps — params are passed explicitly to avoid stale closures
  );

  // ─── Navigation handlers ──────────────────────────────────────────────────
  const goToNextPage = useCallback(() => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchMembers({
      page: nextPage,
      pageSize,
      programFilter,
      sortBy,
      committedSearch,
    });
  }, [currentPage, pageSize, programFilter, sortBy, committedSearch, fetchMembers]);

  const goToPrevPage = useCallback(() => {
    if (currentPage <= 1) return;
    const prevPage = currentPage - 1;
    setCurrentPage(prevPage);
    fetchMembers({
      page: prevPage,
      pageSize,
      programFilter,
      sortBy,
      committedSearch,
    });
  }, [currentPage, pageSize, programFilter, sortBy, committedSearch, fetchMembers]);

  // ─── Filter handlers ──────────────────────────────────────────────────────
  const handleProgramFilter = useCallback(
    (newProgramFilter: string) => {
      setProgramFilter(newProgramFilter);
      resetPagination();
      fetchMembers({
        page: 1,
        pageSize,
        programFilter: newProgramFilter, // use new value directly — no stale state
        sortBy,
        committedSearch,
        forceRefresh: true,
        needCount: true,
      });
    },
    [pageSize, sortBy, committedSearch, fetchMembers, resetPagination]
  );

  const handleSortBy = useCallback(
    (newSortBy: string) => {
      setSortBy(newSortBy);
      resetPagination();
      fetchMembers({
        page: 1,
        pageSize,
        programFilter,
        sortBy: newSortBy, // use new value directly
        committedSearch,
        forceRefresh: true,
      });
    },
    [pageSize, programFilter, committedSearch, fetchMembers, resetPagination]
  );

  const handleViewModeChange = useCallback(
    (mode: "card" | "table") => {
      setViewMode(mode);
      localStorage.setItem("membersViewMode", mode);
      resetPagination();
      const newPageSize =
        mode === "card" ? ITEMS_PER_PAGE_CARD : ITEMS_PER_PAGE_TABLE;
      fetchMembers({
        page: 1,
        pageSize: newPageSize, // use new value directly
        programFilter,
        sortBy,
        committedSearch,
        forceRefresh: true,
      });
    },
    [programFilter, sortBy, committedSearch, fetchMembers, resetPagination]
  );

  // ─── Search handlers (Enter-only) ─────────────────────────────────────────
  /** Update the visible input without triggering any fetch. */
  const handleSearchInputChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  /** Commit the search and fetch — called on Enter key or search button click. */
  const handleSearchCommit = useCallback(() => {
    const trimmed = searchInput.trim();
    setCommittedSearch(trimmed);
    setIsSearchActive(!!trimmed);
    resetPagination();
    fetchMembers({
      page: 1,
      pageSize,
      programFilter,
      sortBy,
      committedSearch: trimmed, // pass directly — state hasn't updated yet
      forceRefresh: true,
      needCount: true,
    });
  }, [searchInput, pageSize, programFilter, sortBy, fetchMembers, resetPagination]);

  /** Clear search and return to normal view. */
  const clearSearch = useCallback(() => {
    setSearchInput("");
    setCommittedSearch("");
    setIsSearchActive(false);
    resetPagination();
    fetchMembers({
      page: 1,
      pageSize,
      programFilter,
      sortBy,
      committedSearch: "",
      forceRefresh: true,
      needCount: true,
    });
  }, [pageSize, programFilter, sortBy, fetchMembers, resetPagination]);

  // ─── Refresh & cache ──────────────────────────────────────────────────────
  const refreshData = useCallback(() => {
    setIsRefreshing(true);
    resetPagination();
    loadStaticData(true).then(() => {
      fetchMembers({
        page: 1,
        pageSize,
        programFilter,
        sortBy,
        committedSearch,
        forceRefresh: true,
        needCount: true,
      });
    });
  }, [
    loadStaticData,
    fetchMembers,
    pageSize,
    programFilter,
    sortBy,
    committedSearch,
    resetPagination,
  ]);

  const clearCache = useCallback(() => {
    clearMembersCache();
    toast.success("Cache cleared");
    resetPagination();
    fetchMembers({
      page: 1,
      pageSize,
      programFilter,
      sortBy,
      committedSearch,
      forceRefresh: true,
      needCount: true,
    });
  }, [pageSize, programFilter, sortBy, committedSearch, fetchMembers, resetPagination]);

  // ─── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    const savedViewMode = localStorage.getItem("membersViewMode") as
      | "card"
      | "table"
      | null;
    if (savedViewMode === "card" || savedViewMode === "table") {
      setViewMode(savedViewMode);
    }

    const initialPageSize =
      savedViewMode === "table" ? ITEMS_PER_PAGE_TABLE : ITEMS_PER_PAGE_CARD;

    loadStaticData(false).then(() => {
      fetchMembers({
        page: 1,
        pageSize: initialPageSize,
        programFilter: "all",
        sortBy: "name-asc",
        committedSearch: "",
        forceRefresh: false,
        needCount: true, // get total on first load only
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — runs once on mount

  // ─── Derived state ────────────────────────────────────────────────────────
  const hasNextPage = members.length === pageSize;
  const hasPrevPage = currentPage > 1;
  const totalPages = Math.ceil(totalMembers / pageSize);

  return {
    // Data
    members,
    faculties,
    programs,
    totalMembers,
    totalPages,
    currentPage,
    term,

    // Pagination
    hasNextPage,
    hasPrevPage,
    goToNextPage,
    goToPrevPage,

    // Search
    searchInput,        // bind to <input value={searchInput} />
    committedSearch,    // what's actually been searched
    isSearchActive,
    handleSearchInputChange,  // onChange
    handleSearchCommit,       // onKeyDown Enter + search button onClick
    clearSearch,

    // Filters
    programFilter,
    sortBy,
    viewMode,

    // State flags
    isLoading,
    isRefreshing,
    dataSource,

    // Actions
    handleProgramFilter,
    handleSortBy,
    handleViewModeChange,
    refreshData,
    clearCache,
  };
}