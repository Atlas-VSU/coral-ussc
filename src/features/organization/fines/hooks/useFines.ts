import { useState, useMemo, useEffect } from "react";
import { StudentFines } from "@/features/organization/fines/types";
import { fetchFinesPaginated, getFinesCount, countStudentsWithFines, countUnsettleFinesOfStudents } from "@/firebase/fines/read/fines";
import { getCurrentUserData } from "@/firebase";
import { Member } from "../../members/types";
import { CACHE_KEYS, cacheService } from "@/services/cacheService";
import { getDashboardUnpaidFinesAmount, getDashboardFeesCollected } from "@/firebase/dashboard";


interface UseFinesProps {
  initialStatusFilter?: string;
  itemsPerPage?: number;
}

export function useFines({ initialStatusFilter = "all", itemsPerPage = 10 }: UseFinesProps = {}) {
  const [paginatedFines, setPaginatedFines] = useState<StudentFines[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState(initialStatusFilter);
  const [totalCount, setTotalCount] = useState(0);
  const [lastVisibleDocs, setLastVisibleDocs] = useState<any[]>([]);

  // Stats
  const [totalStudentsWithFines, setTotalStudentsWithFines] = useState(0);
  const [totalUnsettled, setTotalUnsettled] = useState(0);
  const [totalUnpaidFines, setTotalUnpaidFines] = useState(0); // This might be hard to sum server-side without an aggregation
  const [totalCollectedFines, setTotalCollectedFines] = useState(0);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      const currUser = await getCurrentUserData() as unknown as Member;
      if (!currUser?.id) return;

      setIsLoading(true);
      try {
        // 1. Fetch total count for the current filter
        const count = await getFinesCount(currUser.id, filterStatus, search);
        if (isMounted) setTotalCount(count);

        // 2. Fetch stats (these could be optimized with a single server-side call)
        const [studentsCount, unsettledCount, unpaidTotal, collectedTotal] = await Promise.all([
          countStudentsWithFines(),
          countUnsettleFinesOfStudents(),
          getDashboardUnpaidFinesAmount(),
          getDashboardFeesCollected()
        ]);
        if (isMounted) {
          setTotalStudentsWithFines(studentsCount);
          setTotalUnsettled(unsettledCount);
          setTotalUnpaidFines(unpaidTotal);
          setTotalCollectedFines(collectedTotal);
        }

        // 3. Fetch paginated data
        const isJump = currentPage > 1 && !lastVisibleDocs[currentPage - 2];
        const effectivePageSize = isJump ? (currentPage * itemsPerPage) : itemsPerPage;
        const effectiveCursor = isJump ? null : (currentPage > 1 ? lastVisibleDocs[currentPage - 2] : null);

        const { docs: fetchedDocs, lastVisible, allSnapshots } = await fetchFinesPaginated(
          currUser.id,
          effectivePageSize,
          effectiveCursor,
          search,
          filterStatus
        );

        if (isMounted) {
          const docs = isJump ? fetchedDocs.slice((currentPage - 1) * itemsPerPage) : fetchedDocs;
          setPaginatedFines(docs);
          if (allSnapshots && allSnapshots.length > 0) {
            setLastVisibleDocs(prev => {
              const next = [...prev];
              allSnapshots.forEach((snap, index) => {
                const absoluteIndex = isJump ? index : ((currentPage - 1) * itemsPerPage + index);
                if ((absoluteIndex + 1) % itemsPerPage === 0) {
                  const pageNum = (absoluteIndex + 1) / itemsPerPage;
                  next[pageNum - 1] = snap;
                }
              });
              const finalAbsoluteIndex = isJump ? (allSnapshots.length - 1) : ((currentPage - 1) * itemsPerPage + allSnapshots.length - 1);
              const finalPageNum = Math.ceil((finalAbsoluteIndex + 1) / itemsPerPage);
              next[finalPageNum - 1] = allSnapshots[allSnapshots.length - 1];
              return next;
            });
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error fetching fines:", err);
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [filterStatus, search, currentPage, itemsPerPage]);

  const handleStatusFilterChange = (v: string) => {
    setFilterStatus(v);
    setCurrentPage(1);
    setLastVisibleDocs([]);
  };

  const handleSearchChange = (v: string) => {
    setSearch(v);
    setCurrentPage(1);
    setLastVisibleDocs([]);
  };

  const hardRefresh = async () => {
    setIsLoading(true);
    const currUser = await getCurrentUserData() as unknown as Member;
    if (currUser?.id) {
        cacheService.invalidateByPrefix('fines:doc:');
        cacheService.invalidateByPrefix('fines:all:');
        cacheService.invalidateByPrefix('fines:items:');
        cacheService.invalidateByPrefix('fines:student:');
    }
    setCurrentPage(1);
    setFilterStatus("all");
    setLastVisibleDocs([]);
    setIsLoading(false);
    // The useEffect will trigger fetchData
  };

  return {
    paginatedFines,
    filteredCount: totalCount,
    isLoading,
    currentPage,
    setCurrentPage,
    totalPages: Math.ceil(totalCount / itemsPerPage),
    search,
    setSearch: handleSearchChange,
    filterStatus,
    handleStatusFilterChange,
    totalStudentsWithFines,
    totalUnsettled,
    totalUnpaidFines, // Note: Unpaid total sum across 9,000 needs aggregation doc
    totalCollectedFines, // Note: Collected total sum across 9,000 needs aggregation doc
    hardRefresh,
  };
}
