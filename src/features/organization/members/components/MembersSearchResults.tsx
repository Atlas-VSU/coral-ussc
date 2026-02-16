import { MemberData, Faculty, Program } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Edit, Trash2, XCircle } from "lucide-react";

interface MembersSearchResultsProps {
  searchQuery: string;
  searchResults: MemberData[];
  programs: Program[];
  faculties: Faculty[];
  onEdit: (member: MemberData) => void;
  onDelete: (member: MemberData) => void;
  onClearSearch: () => void;
  isSearching: boolean;
}

export function MembersSearchResults({
  searchQuery,
  searchResults,
  programs,
  faculties,
  onEdit,
  onDelete,
  onClearSearch,
  isSearching,
}: MembersSearchResultsProps) {
  // Get program and faculty names by ID
  const getProgramName = (programId: string) => {
    const program = programs.find((p) => p.id === programId);
    return program?.name || "Unknown Program";
  };

  const getFacultyName = (facultyId?: string) => {
    if (!facultyId) return "Unknown Faculty";
    const faculty = faculties.find((f) => f.id === facultyId);
    return faculty?.name || "Unknown Faculty";
  };

  if (isSearching) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
        <p className="text-gray-500 mt-4">Searching...</p>
      </div>
    );
  }

  if (searchResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-sm text-center">
          <XCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            No results found
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            No members matching &quot;{searchQuery}&quot; were found.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSearch}
            className="mt-4"
          >
            Clear Search
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">
          Search Results for &quot;{searchQuery}&quot;
        </h2>
        <Button variant="outline" size="sm" onClick={onClearSearch}>
          Clear Search
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {searchResults.map((member) => (
          <Card
            key={member.id}
            className="p-4 shadow-sm hover:shadow transition-shadow"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">
                    {member.member.firstName} {member.member.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">{member.member.email}</p>
                </div>
                <Badge variant="outline">{member.member.studentId}</Badge>
              </div>

              <div className="space-y-1">
                <p className="text-sm">
                  <span className="text-gray-500">Program:</span>{" "}
                  {getProgramName(member.member.programId)}
                </p>
                <p className="text-sm">
                  <span className="text-gray-500">Faculty:</span>{" "}
                  {getFacultyName(member.member.facultyId)}
                </p>
                {member.member.yearLevel && (
                  <p className="text-sm">
                    <span className="text-gray-500">Year Level:</span>{" "}
                    {member.member.yearLevel}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(member)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(member)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
