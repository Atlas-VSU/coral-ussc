// app/admin/fees/roster/components/SearchFilterBar.tsx
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SearchFilterFee({
  search,
  onSearchChange,
  filterStatus,
  onFilterChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  filterStatus: string;
  onFilterChange: (value: string) => void;
}) {
  return (
    <>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Search fees..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 w-48"
        />
      </div>
      <Select value={filterStatus} onValueChange={onFilterChange}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Fee Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="semester-membership">Semester Membership</SelectItem>
          <SelectItem value="event-fee">Event Fee</SelectItem>
          <SelectItem value="charity-fee">Charity Fee</SelectItem>
          <SelectItem value="organization-dues">Organization Dues</SelectItem>
        </SelectContent>
      </Select>
    </>
  );
}