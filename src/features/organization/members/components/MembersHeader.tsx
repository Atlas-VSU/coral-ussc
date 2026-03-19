import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Upload, RefreshCw, Search } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";

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
    <div className="flex flex-col gap-4">
      {/* <PageHeader
        variant="admin"
        title="Student Management"
        context="2nd Semester · A.Y. 2025–2026"
        description="Registration and approval of USSC members"
      /> */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="bg-linear-to-r from-[#8BC34A] via-[#2E7D32] to-[#1B5E20] bg-clip-text text-transparent text-2xl font-bold uppercase tracking-tight">
            Members Management
          </h1>
          {/* Semester not dynamic..... */}
          <p className="text-[#1B5E20]/60">2nd Semester · A.Y. 2025–2026</p>
          <p className="text-sm text-[#1B5E20]/50">
            There are {formattedMemberCount}{" "}
            {totalMembers === 1 ? "member" : "members"} in your organization
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
              className="absolute right-0 top-0 h-full px-3 text-green-800 hover:bg-green-100 hover:text-black"
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
              className="relative text-black border-gray-300 hover:bg-green-100 hover:text-black"
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
              className="hidden md:flex text-black border-gray-300 hover:bg-green-100 hover:text-black"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>

            <Button
              size="sm"
              onClick={onAddMember}
              className="bg-white border border-gray-300 text-black hover:bg-gray-100 hover:text-black"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
