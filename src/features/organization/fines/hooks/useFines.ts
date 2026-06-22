import { useState, useMemo, useEffect, useRef } from "react";
import { StudentFines } from "@/features/organization/fines/types";
import { fetchFinesPaginated, getFinesCount, countStudentsWithFines, countUnsettleFinesOfStudents, checkFineSeededForTerm } from "@/firebase/fines/read/fines";
import { getCurrentUserData } from "@/firebase";
import { Member } from "../../members/types";
import { CACHE_KEYS, cacheService } from "@/services/cacheService";
import { getStats } from "@/firebase/stats/read/getStats";
import { getActiveTerm } from "@/firebase/term";
import { useTermPeriod } from "../../term/hooks/useTermPeriod";
import { set } from "zod";


interface UseFinesProps {
  initialStatusFilter?: string;
  itemsPerPage?: number;
}

export function useFines({ initialStatusFilter = "all", itemsPerPage = 9 }: UseFinesProps = {}) {
  const [paginatedFines, setPaginatedFines] = useState<StudentFines[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState(initialStatusFilter);
  const [totalCount, setTotalCount] = useState(0);
  const cursorsRef = useRef<Record<number, any>>({});
  const [refreshKey, setRefreshKey] = useState(false);
  const { selected } = useTermPeriod();
  const [doneSeeding, setDoneSeeding] = useState(false);

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
        // Fetch total count for the current filter
        const count = await getFinesCount(currUser.orgId!, filterStatus, search, selected);
        if (isMounted) setTotalCount(count);

        //Fetch current term
        const term = selected || await getActiveTerm();

        //  Fetch stats and term (these could be optimized with a single server-side call)
        const [studentsCount, unsettledCount,stats, seed] = await Promise.all([
          countStudentsWithFines(selected),
          countUnsettleFinesOfStudents(selected),
          getStats(`${term!.AY}-${term!.semester}-${currUser.orgId}`),
          checkFineSeededForTerm(currUser.orgId!, {AY: term!.AY, semester: term!.semester})
        ]);
        if (isMounted) {
          setTotalStudentsWithFines(studentsCount);
          setTotalUnsettled(unsettledCount);
          setTotalUnpaidFines(stats?.totalUnpaidFines || 0);
          setTotalCollectedFines(stats?.totalCollectedFines || 0);
          setDoneSeeding(seed);
        }

        // Fetch paginated data
        const cursor = currentPage > 1 ? (cursorsRef.current[currentPage - 2] ?? null) : null;

        const { docs: fetchedDocs, lastVisible } = await fetchFinesPaginated(
          currUser.orgId!,
          itemsPerPage,
          cursor,
          search,
          filterStatus,
          selected
        );

        if (isMounted) {
          setPaginatedFines(fetchedDocs);
          if (lastVisible) {
            cursorsRef.current[currentPage - 1] = lastVisible;
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
  }, [filterStatus, search, currentPage, itemsPerPage, refreshKey, selected]);

  const handleStatusFilterChange = (v: string) => {
    setFilterStatus(v);
    setCurrentPage(1);
    cursorsRef.current = {};
  };

  const refreshFineItems = () => { 
    cacheService.invalidateByPrefix('fines:items:');
  };

  const handleSearchChange = (v: string) => {
    setSearch(v);
    setCurrentPage(1);
    cursorsRef.current = {};
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
    cursorsRef.current = {};
    setRefreshKey(prev => !prev); 
    setIsLoading(false);
    // The useEffect will trigger fetchData
  };

  return {
    paginatedFines,
    doneSeeding,
    filteredCount: totalCount,
    isLoading,
    currentPage,
    AY: selected?.AY || "", sem: selected?.semester || "",
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
    hardRefresh, setPaginatedFines, setTotalCount,
    setFilterStatus, refreshFineItems
  };
}
