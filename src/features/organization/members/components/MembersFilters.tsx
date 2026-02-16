import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Program } from "../types";
import { ViewToggle, ViewMode } from "./ViewToggle";

interface MembersFiltersProps {
  programs: Program[];
  onSearch: (term: string) => void;
  onProgramFilter: (programId: string) => void;
  onSortBy: (sortBy: string) => void;
  searchTerm: string;
  programFilter: string;
  disabled?: boolean;
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
}

export function MembersFilters({
  programs,
  onSearch,
  onProgramFilter,
  onSortBy,
  searchTerm,
  programFilter,
  disabled = false,
  viewMode,
  onViewChange,
}: MembersFiltersProps) {
  const [sortBy, setSortBy] = useState<string>("name-asc");
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchTerm(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevents any default form submission behavior
      onSearch(localSearchTerm); // Fire the actual search
    }
  };

  const handleClearSearch = () => {
    setLocalSearchTerm("");
    onSearch("");
  };
  const handleSortByChange = (value: string) => {
    setSortBy(value);
    onSortBy(value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-3 sm:p-4">
      {/* Header Section - Only show on mobile/tablet */}
      <div className="mb-3 lg:hidden">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
          Search & Filter Members
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
          Find members by name, ID, or filter by program
        </p>
      </div>

      {/* Controls Section */}
      <div className="space-y-3 sm:space-y-0">
        {/* Mobile/Tablet: Stack filters vertically */}
        <div className="flex flex-col gap-3 lg:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              placeholder="Search by name, ID or email..."
              className="pl-10 pr-10 h-10 border-gray-200 dark:border-gray-700"
              value={localSearchTerm} // Use local state for the value
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown} // Add the key down handler
              disabled={true}
            />
            {/* The clear button logic remains the same and will work correctly */}
            {localSearchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={handleClearSearch}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Program Filter - Full width */}
          <Select
            value={programFilter}
            onValueChange={onProgramFilter}
            disabled={disabled}
          >
            <SelectTrigger className="w-full h-10 border-gray-200 dark:border-gray-700">
              <SelectValue placeholder="Filter by program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {programs.map((program) => (
                <SelectItem key={program.id} value={program.id}>
                  {program.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Selector - Full width */}
          <Select
            value={sortBy}
            onValueChange={handleSortByChange}
            disabled={disabled}
          >
            <SelectTrigger className="w-full h-10 border-gray-200 dark:border-gray-700">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="id-asc">Student ID (Low to High)</SelectItem>
              <SelectItem value="id-desc">Student ID (High to Low)</SelectItem>
              <SelectItem value="date-asc">Date (Newest First)</SelectItem>
              <SelectItem value="date-desc">Date (Oldest First)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Desktop: Horizontal layout */}
        <div className="hidden lg:flex lg:flex-col lg:gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              Search & Filter Members
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Find members by name, ID, or filter by program
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* View Toggle - Only show on desktop */}
            {isDesktop && (
              <ViewToggle viewMode={viewMode} onViewChange={onViewChange} />
            )}

            {/* Program Filter */}
            <Select
              value={programFilter}
              onValueChange={onProgramFilter}
              disabled={disabled}
            >
              <SelectTrigger className="w-[160px] h-9 border-gray-200 dark:border-gray-700">
                <SelectValue placeholder="All Programs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                {programs.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Selector */}
            <Select
              value={sortBy}
              onValueChange={handleSortByChange}
              disabled={disabled}
            >
              <SelectTrigger className="w-[150px] h-9 border-gray-200 dark:border-gray-700">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="id-asc">ID (Low-High)</SelectItem>
                <SelectItem value="id-desc">ID (High-Low)</SelectItem>
                <SelectItem value="date-asc">Date (Newest First)</SelectItem>
                <SelectItem value="date-desc">Date (Oldest First)</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear All Filters */}
            {(searchTerm ||
              programFilter !== "all" ||
              sortBy !== "name-asc") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onSearch("");
                  onProgramFilter("all");
                  handleSortByChange("name-asc");
                }}
                disabled={disabled}
                className="text-xs h-9 px-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Clear all
              </Button>
            )}
          </div>
        </div>

        {/* Mobile/Tablet: Clear filters button - separate row */}
        {(searchTerm || programFilter !== "all" || sortBy !== "name-asc") && (
          <div className="lg:hidden pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onSearch("");
                onProgramFilter("all");
                handleSortByChange("name-asc");
              }}
              disabled={disabled}
              className="w-full text-xs h-9 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 justify-center"
            >
              Clear all filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
