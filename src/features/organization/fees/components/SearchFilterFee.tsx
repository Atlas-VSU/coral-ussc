// app/admin/fees/roster/components/SearchFilterBar.tsx
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { Button } from "../local-components/button";
import { SearchInput } from "@/components/shared/SearchInput";

export function SearchFilterFee({
  search,
  onSearchChange,
  filterStatus,
  onFilterChange,
  isLoading
}: {
  search: string;
  onSearchChange: (value: string) => void;
  filterStatus: string;
  onFilterChange: (value: string) => void;
  isLoading?: boolean;
  }) {
  
  const [localSearch, setLocalSearch] = useState(search);
  
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(localSearch);
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