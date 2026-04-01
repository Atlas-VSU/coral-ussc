// app/admin/fees/roster/components/SearchFilterBar.tsx
import { RefreshCcw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/organization/general/SearchInput";
import { useEffect, useState } from "react";

export function SearchFilterBar({
  search,
  onSearchChange,
  filterStatus,
  onFilterChange,
  showUnpaidFilter,
  handleRefresh,
  isLoading
}: {
  search: string;
  onSearchChange: (value: string) => void;
  filterStatus: string;
  onFilterChange: (value: string) => void;
  showUnpaidFilter: boolean;
  handleRefresh: () => void;
  isLoading?: boolean;
}) {
  const [localSearch, setLocalSearch] = useState(search);
  useEffect(() => {
    setLocalSearch(search);
  }, [search])
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(localSearch);
  }

  const handleRefreshLocal = () => {
    setLocalSearch("");
    onSearchChange("");
    onFilterChange("all");
    handleRefresh();
  }
  
  return (
    <>
      <div className="relative">
      <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
        <SearchInput
          placeholder="Search by name or ID..."
          value={localSearch}
          onChange={v => setLocalSearch(v)} // Only update local state on keystroke
          className="w-full sm:w-64"
        />
        <Button type="submit" variant="secondary" size="icon" disabled={isLoading}>
          <Search className="h-4 w-4" />
          <span className="sr-only">Search</span>
        </Button>
      </form>
      </div>
      <Select value={filterStatus} onValueChange={onFilterChange}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          {!showUnpaidFilter && <SelectItem value="verified">Verified</SelectItem>}
          <SelectItem value="rejected">Rejected</SelectItem>
          {showUnpaidFilter && <SelectItem value="unpaid">Unpaid</SelectItem>}
          {showUnpaidFilter && <SelectItem value="paid">Paid</SelectItem>}
        </SelectContent>
      </Select>

      <Button onClick={handleRefreshLocal} variant="outline" disabled={isLoading}>
        <RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        {isLoading ? 'Refreshing...' : 'Refresh'}
      </Button>
    </>
  );
}