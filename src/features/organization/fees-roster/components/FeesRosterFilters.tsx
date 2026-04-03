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

interface FeesRosterFiltersProps {
  // Search — split into three focused props
  searchTerm: string;                        // controlled input value
  onSearchChange: (value: string) => void;   // onChange (no fetch)
  onSearchCommit: () => void;                // Enter / button click (triggers fetch)
  onSearchClear: () => void;                 // clear button
  filterStatus: string;
  onFilterChange: (status: string) => void;
  showUnpaidFilter: boolean;                 // true for "All Students" tab
  onRefresh: () => void;
  disabled?: boolean;
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
}

export function FeesRosterFilters({
  searchTerm,
  onSearchChange,
  onSearchCommit,
  onSearchClear,
  filterStatus,
  onFilterChange,
  showUnpaidFilter,
  onRefresh,
  disabled = false,
  viewMode,
  onViewChange,
}: FeesRosterFiltersProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const lightSelectTriggerClass =
    "bg-white text-black border-gray-200 hover:bg-green-50 focus:ring-green-200";
  const lightSelectContentClass = "bg-white text-black border-gray-200";
  const lightSelectItemClass = "text-black focus:bg-green-50 focus:text-black";

  const handleClearAll = () => {
    onSearchClear();
    onFilterChange("all");
  };

  const handleRefreshAll = () => {
    if(hasActiveFilters || searchTerm !== '') {
      handleClearAll();
    } else {
      onRefresh();
    }
  };

  const hasActiveFilters = searchTerm !== "" || filterStatus !== "all";

  // ── SearchInput component (reused in mobile + desktop) ───────────────────
  const SearchInput = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSearchCommit();
      }}
      className="relative flex-1 lg:flex-initial"
    >
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by name or ID..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSearchCommit();
            }
          }}
          disabled={disabled}
          className="h-9 pl-9 pr-9 bg-white border-gray-200 text-black placeholder:text-gray-400 focus:ring-green-200 lg:w-[280px]"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={onSearchClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </form>
  );

  return (
    <div className="bg-white rounded-lg border shadow-sm p-3 sm:p-4">
      {/* ── Mobile layout ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 lg:hidden">
        <div>
          <h3 className="text-sm font-medium text-green-800 mb-1">
            Search & Filter Students
          </h3>
          <p className="text-xs text-gray-500 hidden sm:block">
            Find students by name or ID, filter by payment status
          </p>
        </div>

        {SearchInput}

        <Select
          value={filterStatus}
          onValueChange={onFilterChange}
          disabled={disabled}
        >
          <SelectTrigger className={`w-full h-10 ${lightSelectTriggerClass}`}>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className={lightSelectContentClass}>
            <SelectItem value="all" className={lightSelectItemClass}>
              All Status
            </SelectItem>
            {!showUnpaidFilter && (
              <>
                <SelectItem value="pending" className={lightSelectItemClass}>
                  Pending
                </SelectItem>
                <SelectItem value="verified" className={lightSelectItemClass}>
                  Verified
                </SelectItem>
                <SelectItem value="rejected" className={lightSelectItemClass}>
                  Rejected
                </SelectItem>
              </>
            )}
            {showUnpaidFilter && (
              <>
              <SelectItem value="pending" className={lightSelectItemClass}>
                Pending
              </SelectItem>
              {!showUnpaidFilter && (
                <SelectItem value="verified" className={lightSelectItemClass}>
                  Verified
                </SelectItem>
              )}
              <SelectItem value="rejected" className={lightSelectItemClass}>
                Rejected
              </SelectItem>
              {showUnpaidFilter && (
                <SelectItem value="unpaid" className={lightSelectItemClass}>
                  Unpaid
                </SelectItem>
              )}
              {showUnpaidFilter && (
                <SelectItem value="paid" className={lightSelectItemClass}>
                  Paid
                </SelectItem>
              )}
              </>
            )}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshAll}
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
            Search & Filter Students
          </h3>
          <p className="text-xs text-gray-500">
            Find students by name or ID, filter by payment status
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 flex-1 xl:justify-end">
          {/* Search — takes remaining space */}
          {SearchInput}

          {isDesktop && (
            <ViewToggle viewMode={viewMode} onViewChange={onViewChange} />
          )}

          <Select
            value={filterStatus}
            onValueChange={onFilterChange}
            disabled={disabled}
          >
            <SelectTrigger className={`w-[140px] h-9 ${lightSelectTriggerClass}`}>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className={lightSelectContentClass}>
              <SelectItem value="all" className={lightSelectItemClass}>
                All Status
              </SelectItem>
              <SelectItem value="pending" className={lightSelectItemClass}>
                Pending
              </SelectItem>
              {!showUnpaidFilter && (
                <SelectItem value="verified" className={lightSelectItemClass}>
                  Verified
                </SelectItem>
              )}
              <SelectItem value="rejected" className={lightSelectItemClass}>
                Rejected
              </SelectItem>
              {showUnpaidFilter && (
                <SelectItem value="unpaid" className={lightSelectItemClass}>
                  Unpaid
                </SelectItem>
              )}
              {showUnpaidFilter && (
                <SelectItem value="paid" className={lightSelectItemClass}>
                  Paid
                </SelectItem>
              )}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
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
