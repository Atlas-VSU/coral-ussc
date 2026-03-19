import { useState, useMemo, useEffect } from "react";
import { StudentFines } from "@/features/organization/fines/types";
import { subscribeFines } from "@/firebase/fines/read/fines";
import { getCurrentUserData } from "@/firebase";
import { Member } from "../../members/types";
import { CACHE_KEYS, cacheService } from "@/services/cacheService";


interface UseFinesProps {
  initialStatusFilter?: string;
  itemsPerPage?: number;
}

export function useFines({ initialStatusFilter = "all", itemsPerPage = 10 }: UseFinesProps = {}) {
  const [allFines, setAllFines] = useState<StudentFines[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState(initialStatusFilter);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const init = async () => {
      const currUser = await getCurrentUserData() as unknown as Member;
      if (!currUser?.id) return;

      const cached = cacheService.get<StudentFines[]>(CACHE_KEYS.finesAll(currUser.id));
      if (cached) {
        setAllFines(cached.data);
      } else {
        setIsLoading(true); 
      }

      unsubscribe = subscribeFines(
        currUser.id,
        (fines) => {
          setAllFines(fines);
          setIsLoading(false);
        },
        (error) => {
          console.error("Fines subscription error:", error);
          setIsLoading(false);
        }
      );
    };

    init();

    return () => unsubscribe?.();
  }, []);

  const totalStudentsWithFines = useMemo(() => {
    const uniqueStudents = new Set(allFines.map(f => f.studentId));
    return uniqueStudents.size;
  }, [allFines]);

  const totalUnsettled = useMemo(() => {
    return allFines.filter(f => f.status !== "paid").length;
  }, [allFines]);

  const totalUnpaidFines = useMemo(() => {
    return allFines
      .filter(f => f.status !== "paid")
      .reduce((sum, f) => sum + f.accumulatedAmount, 0);
  }, [allFines]);

  const totalCollectedFines = useMemo(() => {
    return allFines
      .filter(f => f.status === "paid")
      .reduce((sum, f) => sum + f.paidAmount, 0);
  }, [allFines]);

  const filtered = useMemo(() => {
    return allFines.filter(f => {
      const matchesStatus = filterStatus === "all" || f.status === filterStatus;
      const q = search.toLowerCase().trim();
      const matchesSearch = !q ||
        f.userName.toLowerCase().includes(q) ||
        f.studentId.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [allFines, filterStatus, search]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedFines = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, search]);

  const handleStatusFilterChange = (v: string) => {
    setFilterStatus(v);
    setSearch("");
  };

  return {
    allFines,
    paginatedFines,
    filteredCount: filtered.length,
    isLoading,
    currentPage,
    setCurrentPage,
    totalPages,
    search,
    setSearch,
    filterStatus,
    handleStatusFilterChange,
    totalStudentsWithFines,
    totalUnsettled,
    totalUnpaidFines,
    totalCollectedFines,
  };
}