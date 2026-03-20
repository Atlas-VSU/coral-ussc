// app/admin/fees/roster/components/SearchFilterBar.tsx
import { RefreshCcw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../local-components/Select";
import { Button } from "../local-components/button";

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
  return (
    <>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Search Name or Student ID..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 w-48"
        />
      </div>
      <Select value={filterStatus} onValueChange={onFilterChange}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="verified">Verified</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
          {showUnpaidFilter && <SelectItem value="unpaid">Unpaid</SelectItem>}
        </SelectContent>
      </Select>

      <Button onClick={handleRefresh} variant="outline" disabled={isLoading}>
        <RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        {isLoading ? 'Refreshing...' : 'Refresh'}
      </Button>
    </>
  );
}