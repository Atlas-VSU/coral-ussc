import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Faculty, Program } from "../types";

interface MembersSearchProps {
  programs: Program[];
  faculties: Faculty[];
  onSearch: (term: string) => void;
  onProgramFilter: (programId: string) => void;
  onViewStyleChange: (style: "card" | "compact") => void;
  searchTerm: string;
  programFilter: string;
  viewStyle: "card" | "compact";
}

export function MembersSearch({
  programs,
  onSearch,
  onProgramFilter,
  onViewStyleChange,
  searchTerm,
  programFilter,
  viewStyle,
}: MembersSearchProps) {
  const handleClearSearch = () => {
    onSearch("");
  };

  const resetFilters = () => {
    onProgramFilter("all");
  };

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, ID or email..."
          className="pl-9 pr-9"
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={handleClearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Program filter */}
          <Select value={programFilter} onValueChange={onProgramFilter}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Program" />
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

          {/* Reset filters button */}
          {programFilter !== "all" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9"
              onClick={resetFilters}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* View style toggle */}
        <Tabs
          value={viewStyle}
          onValueChange={(value) =>
            onViewStyleChange(value as "card" | "compact")
          }
          className="self-end"
        >
          <TabsList className="h-9">
            <TabsTrigger value="card" className="text-xs px-3">
              Card View
            </TabsTrigger>
            <TabsTrigger value="compact" className="text-xs px-3">
              Compact View
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
