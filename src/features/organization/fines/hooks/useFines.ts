import { useState, useCallback, useMemo, useEffect } from "react";
import { StudentFines } from "@/features/organization/fines/types";
import { countFinesOfStudents, countStudentsWithFines, countUnsettleFinesOfStudents, getAllFines } from "@/firebase/fines/read/fines";

interface UseFinesProps {
  initialStatusFilter?: string;
  itemsPerPage?: number;
}

export function useFines({ initialStatusFilter = "paid", itemsPerPage = 10 }: UseFinesProps = {}) {
  const [allFines, setAllFines] = useState<StudentFines[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState(initialStatusFilter);
  const [totalStudentsWithFines, setTotalStudentsWithFines] = useState(0);
  const [totalUnsettled, setTotalUnsettled] = useState(0);
  const [isStatusChanging, setIsStatusChanging] = useState(true);

  // Initialize stats
  const initializeStats = async () => {
    try {
      let count = await countStudentsWithFines();
      setTotalStudentsWithFines(count);
      count = await countUnsettleFinesOfStudents();
      setTotalUnsettled(count);
    } catch (error) {
      console.error("Failed to fetch total count of students with fines:", error);
    }
  };

  // Fetch ALL fines once (or when status filter changes)
  const fetchAllFines = useCallback(async (status: string) => {
    setIsLoading(true);
    try {
      const docs = await getAllFines(status);
      setAllFines(docs);
      setCurrentPage(1); // always reset to page 1 on new fetch
    } catch (error) {
      console.error("Failed to fetch fines:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isStatusChanging) {
      setIsStatusChanging(false);
      initializeStats();
    }
      
    fetchAllFines(filterStatus);
  }, [filterStatus, isStatusChanging, fetchAllFines]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Filter in memory (search + status already filtered at fetch level) 
  const filtered = useMemo(() => {
    if (!search.trim()) return allFines;
    const q = search.toLowerCase();
    return allFines.filter(f =>
      f.userName.toLowerCase().includes(q) ||
      f.studentId.toLowerCase().includes(q)
    );
  }, [allFines, search]);

  // Client-side pagination 
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedFines = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleStatusFilterChange = (v: string) => {
    setFilterStatus(v);
    setSearch(""); // clear search when switching status
  };

  const markStatusChanged = () => {
    setIsStatusChanging(true);
    setFilterStatus("paid");
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
    markStatusChanged,
  };
}
