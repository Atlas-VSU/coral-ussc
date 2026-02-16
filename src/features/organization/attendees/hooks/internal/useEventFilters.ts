import { useState, useCallback } from "react";
import { SearchParams } from "../../types";

type SortOption = {
  field: string;
  direction: "asc" | "desc";
};

export const useEventFilters = () => {
  const [searchQuery, setSearchQuery] = useState<SearchParams | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>({
    field: "firstName",
    direction: "asc",
  });
  const [programFilter, setProgramFilter] = useState<string | null>(null);

  // Handlers for user interactions
  const handleSearch = useCallback((query: SearchParams) => {
    setSearchQuery(query);
  }, []);

  const handleSortChange = useCallback((value: string) => {
    const [field, direction] = value.split("-") as [string, "asc" | "desc"];
    setSortOption({ field, direction });
  }, []);

  const handleProgramFilter = useCallback((program: string | undefined) => {
    setProgramFilter(program || null);
  }, []);

  return {
    searchQuery,
    sortOption,
    programFilter,
    handleSearch,
    handleSortChange,
    handleProgramFilter,
  };
};
