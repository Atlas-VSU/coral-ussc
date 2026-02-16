import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Upload, RefreshCw, Search } from "lucide-react";
import { useState } from "react";

interface MembersHeaderProps {
  onSearch: (query: string) => void;
  onAddMember: () => void;
  onBulkImport: () => void;
  onRefresh: () => void;
  totalMembers: number;
  isRefreshing?: boolean;
}

export function MembersHeader({
  onSearch,
  onAddMember,
  onBulkImport,
  onRefresh,
  totalMembers,
  isRefreshing = false,
}: MembersHeaderProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim());
    }
  };

  // Format the member count
  const formattedMemberCount = new Intl.NumberFormat().format(totalMembers);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          Members
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {formattedMemberCount} {totalMembers === 1 ? "member" : "members"} in
          your organization
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <form
          onSubmit={handleSearchSubmit}
          className="relative w-full sm:w-64 md:w-80 flex"
        >
          <Input
            type="search"
            placeholder="Search member coming soon..."
            className="w-full pr-10"
            value={searchTerm}
            onChange={handleSearchChange}
            disabled
            title="Search feature is coming soon"
          />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            disabled
          >
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="relative"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onBulkImport}
            className="hidden md:flex"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>

          <Button size="sm" onClick={onAddMember}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </div>
      </div>
    </div>
  );
}
