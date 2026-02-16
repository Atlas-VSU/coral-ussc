import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RotateCcwIcon, SearchIcon, XIcon } from "lucide-react";
import { getProgramByFacultyId, getPrograms } from "@/firebase";
import { Program } from "../../members/types";
import { SearchParams } from "../types";

interface AttendeesFiltersProps {
  onSearch: (params: SearchParams) => void;
  onSortChange: (field: string, direction: "asc" | "desc") => void;
  onProgramFilter: (programId: string | undefined) => void;
}

export function AttendeesFilters({
  onSearch,
  onSortChange,
  onProgramFilter,
}: AttendeesFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"name" | "id">("name");
  const [programs, setPrograms] = useState<Program[]>([]);

  useEffect(() => {
    const fetchPrograms = async () => {
      const programsData = await getProgramByFacultyId();
      setPrograms(programsData as unknown as Program[]);
    };
    fetchPrograms();
  }, []);

  const handleSortChange = (value: string) => {
    const [field, direction] = value.split("-");
    onSortChange(field, direction as "asc" | "desc");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ query: searchQuery, type: searchType });
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSearchType("name");
    onSearch({ query: "", type: "name" });
    onSortChange("firstName", "asc");
    onProgramFilter(undefined);
  };

  const clearSearch = () => {
    setSearchQuery("");
    onSearch({ query: "", type: searchType });
  };

  return (
    <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
        <Select defaultValue="firstName-asc" onValueChange={handleSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="firstName-asc">Name (A-Z)</SelectItem>
            <SelectItem value="firstName-desc">Name (Z-A)</SelectItem>
            <SelectItem value="timeIn-asc">Time (Earliest)</SelectItem>
            <SelectItem value="timeOut-desc">Time (Latest)</SelectItem>
            <SelectItem value="studentId-asc">ID (Asc)</SelectItem>
            <SelectItem value="studentId-desc">ID (Desc)</SelectItem>
          </SelectContent>
        </Select>

        <Select
          onValueChange={(value) =>
            onProgramFilter(value === "all" ? undefined : value)
          }
        >
          <SelectTrigger className="w-[180px]">
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
        <Button variant="outline" onClick={handleResetFilters}>
          <RotateCcwIcon className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </div>

      <form
        onSubmit={handleSearch}
        className="relative w-full sm:w-auto flex-1 sm:max-w-[400px] flex items-center"
      >
        {/* Search Type Dropdown */}
        <Select
          defaultValue="name"
          onValueChange={(value) => setSearchType(value as "name" | "id")}
          disabled
        >
          <SelectTrigger className="w-[90px] rounded-r-none focus:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="id">ID</SelectItem>
          </SelectContent>
        </Select>

        {/* Search Input Field */}
        <div className="relative w-full">
          <Input
            placeholder={`Search by ${searchType} coming soon...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-l-none pr-8"
            disabled
          />
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-8 top-0 h-full"
              onClick={clearSearch}
              disabled
            >
              <XIcon className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full"
            disabled
          >
            <SearchIcon className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
