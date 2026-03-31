"use client";

import { useMemo, useState } from "react";
import { AggregatedFee } from "../types";
import { feeTypeLabels } from "../constants";

interface UseFeeListUIProps {
  aggregatedFees: AggregatedFee[];
  feesLoading: boolean;
  membersLoading: boolean;
  refetchFees: () => void;
  itemsPerPage?: number;
}

export function useFeeListUI({
  aggregatedFees,
  feesLoading,
  membersLoading,
  refetchFees,
  itemsPerPage = 10,
}: UseFeeListUIProps) {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [generateOpen, setGenerateOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<"all" | "semester-membership" | "event-fee" | "charity-fee" | "organization-dues">("all");
  
  const filtered = useMemo(() => {
    return aggregatedFees.filter(
      (f) => {
        const matchesSearch = f.title.toLowerCase().includes(search.toLowerCase()) ||
        feeTypeLabels[f.type]?.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filterStatus === "all" || f.type === filterStatus;
        return matchesSearch && matchesFilter;
      }
    );
  }, [aggregatedFees, search, filterStatus]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  
  const paginated = useMemo(() => {
    return filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const handleGenerationSuccess = () => {
    refetchFees();
    setGenerateOpen(false);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const isLoading = feesLoading || membersLoading;

  return {
    state: {
      search,
      filterStatus,
      viewMode,
      generateOpen,
      currentPage,
      isLoading,
    },
    actions: {
      setSearch: handleSearchChange,
      setFilterStatus,
      setViewMode,
      setGenerateOpen,
      setCurrentPage,
      handleGenerationSuccess,
    },
    computed: {
      filtered,
      paginated,
      totalPages,
    },
  };
}
