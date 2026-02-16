import { MemberData, Faculty, Program } from "../types";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface MembersTableProps {
  members: MemberData[];
  programs: Program[];
  faculties: Faculty[];
  onEdit: (member: MemberData) => void;
  onDelete: (member: MemberData) => void;
}

export function MembersTable({
  members,
  programs,
  faculties,
  onEdit,
  onDelete,
}: MembersTableProps) {
  const getProgramName = (programId: string) => {
    const program = programs.find((p) => p.id === programId);
    return program ? program.name : "N/A";
  };

  const getFacultyName = (facultyId: string) => {
    const faculty = faculties.find((f) => f.id === facultyId);
    return faculty ? faculty.name : "N/A";
  };

  if (members.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-12 text-center">
        <div className="max-w-sm mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No members found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Try adjusting your search or filter criteria, or add a new member to
            get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm overflow-hidden">
      {/* Mobile View - Card-like layout for small screens */}
      <div className="block sm:hidden">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {members.map((memberData) => (
            <div
              key={memberData.id}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="space-y-3">
                {/* Name and Student ID */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                      {memberData.member?.firstName}{" "}
                      {memberData.member?.lastName}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">
                      ID: {memberData.member?.studentId}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => onEdit(memberData)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                      onClick={() => onDelete(memberData)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Program and Faculty */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">
                      Program:
                    </span>
                    <span className="text-gray-700 dark:text-gray-300 text-right">
                      {getProgramName(memberData.member?.programId)}
                      {memberData.member?.yearLevel &&
                        ` - ${memberData.member.yearLevel}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">
                      Faculty:
                    </span>
                    <span className="text-gray-700 dark:text-gray-300 text-right">
                      {getFacultyName(memberData.member.facultyId as string)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tablet and Desktop View - Traditional table layout */}
      <div className="hidden sm:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <TableHead className="font-semibold text-gray-900 dark:text-gray-100 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm">
                  First Name
                </TableHead>
                <TableHead className="font-semibold text-gray-900 dark:text-gray-100 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm">
                  Last Name
                </TableHead>
                <TableHead className="font-semibold text-gray-900 dark:text-gray-100 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm hidden md:table-cell">
                  Program
                </TableHead>
                <TableHead className="font-semibold text-gray-900 dark:text-gray-100 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm hidden lg:table-cell">
                  Faculty
                </TableHead>
                <TableHead className="font-semibold text-gray-900 dark:text-gray-100 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm">
                  Student ID
                </TableHead>
                <TableHead className="text-right font-semibold text-gray-900 dark:text-gray-100 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((memberData, index) => (
                <TableRow
                  key={memberData.id}
                  className={`border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    index % 2 === 0 ? "bg-gray-25 dark:bg-gray-900/50" : ""
                  }`}
                >
                  <TableCell className="font-medium text-gray-900 dark:text-gray-100 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm">
                    {memberData.member?.firstName}
                  </TableCell>
                  <TableCell className="font-medium text-gray-900 dark:text-gray-100 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm">
                    {memberData.member?.lastName}
                  </TableCell>
                  <TableCell className="text-gray-700 dark:text-gray-300 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[150px] lg:max-w-none">
                        {getProgramName(memberData.member?.programId)}
                        {memberData.member?.yearLevel &&
                          ` - ${memberData.member.yearLevel}`}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-700 dark:text-gray-300 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm hidden lg:table-cell">
                    <span className="truncate max-w-[120px] xl:max-w-none block">
                      {getFacultyName(memberData.member?.facultyId as string) ||
                        "N/A"}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-700 dark:text-gray-300 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm">
                    <div className="font-mono text-xs sm:text-sm">
                      {memberData.member?.studentId}
                    </div>
                  </TableCell>
                  <TableCell className="text-right px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                    <div className="flex items-center justify-end gap-1 sm:gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => onEdit(memberData)}
                      >
                        <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                        onClick={() => onDelete(memberData)}
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
