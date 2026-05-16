import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, X, RefreshCcw } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ViewToggle, ViewMode } from "@/components/organization/general/ViewToggle";

interface FinesFiltersProps {
  // Search — split into three focused props
  searchTerm: string;                        // controlled input value
  onSearchChange: (value: string) => void;   // onChange (no fetch)
  onSearchCommit: () => void;                // Enter / button click (triggers fetch)
  onSearchClear: () => void;                 // clear button
  onStatusChange: (status: string) => void;
  statusFilter: string;
  onRefresh: () => void;
  disabled?: boolean;
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
}

export function FinesFilters({
  searchTerm,
  onSearchChange,
  onSearchCommit,
  onSearchClear,
  onStatusChange,
  statusFilter,
  onRefresh,
  disabled = false,
  viewMode,
  onViewChange,
}: FinesFiltersProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const lightSelectTriggerClass =
    "bg-white text-black border-gray-200 hover:bg-green-50 focus:ring-green-200";
  const lightSelectContentClass = "bg-white text-black border-gray-200";
  const lightSelectItemClass = "text-black focus:bg-green-50 focus:text-black";

  const handleClearAll = () => {
    onSearchClear();
    onStatusChange("all");
  };

  const hasActiveFilters = searchTerm || statusFilter !== "all";

  // Shared search input — used in both mobile and desktop layouts
  const SearchInput = (
    <div className="relative flex-1 min-w-[200px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
      <Input
        placeholder="Search by name or ID… then press Enter"
        className="pl-10 pr-10 h-9 border-gray-200"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSearchCommit();
          }
        }}
        disabled={disabled}
      />
      {searchTerm && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-gray-400 hover:text-black"
          onClick={onSearchClear}
          disabled={disabled}
          type="button"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-lg border shadow-sm p-3 sm:p-4">

      {/* ── Mobile / Tablet layout ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 lg:hidden">
        <div>
          <h3 className="text-sm font-medium text-green-800 mb-1">
            Search & Filter Fines
          </h3>
          <p className="text-xs text-gray-500 hidden sm:block">
            Find fines by name, ID, or filter by status
          </p>
        </div>

        {SearchInput}

        <Select
          value={statusFilter}
          onValueChange={onStatusChange}
          disabled={disabled}
        >
          <SelectTrigger className={`w-full h-10 ${lightSelectTriggerClass}`}>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className={lightSelectContentClass}>
            <SelectItem value="all" className={lightSelectItemClass}>
              All Status
            </SelectItem>
            <SelectItem value="unpaid" className={lightSelectItemClass}>
              Unpaid
            </SelectItem>
            <SelectItem value="pending" className={lightSelectItemClass}>
              Pending
            </SelectItem>
            <SelectItem value="partial" className={lightSelectItemClass}>
              Partial
            </SelectItem>
            <SelectItem value="paid" className={lightSelectItemClass}>
              Paid
            </SelectItem>
            <SelectItem value="waived" className={lightSelectItemClass}>
              Waived
            </SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={disabled}
          className="w-full h-10"
        >
          <RefreshCcw className={`h-4 w-4 mr-2 ${disabled ? 'animate-spin' : ''}`} />
          Refresh
        </Button>

        {hasActiveFilters && (
          <div className="pt-2 border-t border-gray-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              disabled={disabled}
              className="w-full text-xs h-9 text-black hover:bg-green-100 hover:text-black justify-center"
            >
              Clear all filters
            </Button>
          </div>
        )}
      </div>

      {/* ── Desktop layout ─────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:flex-col lg:gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="shrink-0">
          <h3 className="text-sm font-medium text-green-800 mb-1">
            Search & Filter Fines
          </h3>
          <p className="text-xs text-gray-500">
            Find fines by name, ID, or filter by status
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 flex-1 xl:justify-end">
          {/* Search — takes remaining space */}
          {SearchInput}

          {isDesktop && (
            <ViewToggle viewMode={viewMode} onViewChange={onViewChange} />
          )}

          <Select
            value={statusFilter}
            onValueChange={onStatusChange}
            disabled={disabled}
          >
            <SelectTrigger className={`w-[140px] h-9 ${lightSelectTriggerClass}`}>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className={lightSelectContentClass}>
              <SelectItem value="all" className={lightSelectItemClass}>
                All Status
              </SelectItem>
              <SelectItem value="unpaid" className={lightSelectItemClass}>
                Unpaid
              </SelectItem>
              <SelectItem value="pending" className={lightSelectItemClass}>
                Pending
              </SelectItem>
              <SelectItem value="partial" className={lightSelectItemClass}>
                Partial
              </SelectItem>
              <SelectItem value="paid" className={lightSelectItemClass}>
                Paid
              </SelectItem>
              <SelectItem value="waived" className={lightSelectItemClass}>
                Waived
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={disabled}
            className="h-9 px-3"
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${disabled ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              disabled={disabled}
              className="text-xs h-9 px-3 text-black hover:bg-green-100 hover:text-black"
            >
              Clear all
            </Button>
          )}
        </div>
      </div>

    </div>
  );
}
