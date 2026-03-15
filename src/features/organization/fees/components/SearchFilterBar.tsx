// app/admin/fees/roster/components/SearchFilterBar.tsx
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SearchFilterBar({
  search,
  onSearchChange,
  filterStatus,
  onFilterChange,
  showUnpaidFilter,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  filterStatus: string;
  onFilterChange: (value: string) => void;
  showUnpaidFilter: boolean;
}) {
  return (
    <>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Search student..."
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
    </>
  );
}