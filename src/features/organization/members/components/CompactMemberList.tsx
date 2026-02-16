import { MemberData, Faculty, Program } from "../types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Pencil, Trash2, Mail, Hash, Building2 } from "lucide-react";
import { getCurrentUserFacultyId } from "@/firebase";
import { getAuth } from "firebase/auth";

interface CompactMemberListProps {
  members: MemberData[];
  programs: Program[];
  faculties: Faculty[];
  onEdit: (member: MemberData) => void;
  onDelete: (member: MemberData) => void;
}

export async function CompactMemberList({
  members,
  programs,
  faculties,
  onEdit,
  onDelete,
}: CompactMemberListProps) {
  const getProgramName = (programId: string) => {
    const program = programs.find((p) => p.id === programId);
    return program ? program.name : "N/A";
  };

  const currentUserFacultyId = await getCurrentUserFacultyId(
    getAuth().currentUser?.uid || ""
  );

  const getFacultyName = (facultyId: string) => {
    const faculty = faculties.find((f) => f.id === facultyId);
    return faculty ? faculty.name : "N/A";
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getYearLevelText = (yearLevel?: number) => {
    if (!yearLevel) return "";
    const suffixes = ["th", "st", "nd", "rd"];
    const suffix =
      yearLevel % 100 > 10 && yearLevel % 100 < 14
        ? suffixes[0]
        : suffixes[yearLevel % 10] || suffixes[0];
    return `${yearLevel}${suffix} Year`;
  };

  return (
    <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
      {members.map((memberData, index) => (
        <div
          key={memberData.id}
          className={`p-6 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30 dark:hover:from-blue-950/20 dark:hover:to-indigo-950/20 transition-all duration-200 ${
            index === 0 ? "rounded-t-xl" : ""
          } ${index === members.length - 1 ? "rounded-b-xl" : ""}`}
        >
          <div className="flex items-center justify-between gap-4">
            {/* Member Info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Avatar className="h-12 w-12 border-2 border-blue-200 dark:border-blue-700 shadow-sm">
                <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 text-blue-700 dark:text-blue-300 font-bold">
                  {getInitials(
                    memberData.member.firstName,
                    memberData.member.lastName
                  )}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0 space-y-2">
                {/* Name and badges */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100 truncate">
                    {memberData.member.firstName} {memberData.member.lastName}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-300 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-400 dark:border-blue-600 font-semibold text-xs"
                    >
                      {getProgramName(memberData.member.programId)}
                    </Badge>
                    {memberData.member.yearLevel && (
                      <Badge
                        variant="outline"
                        className="text-xs font-semibold"
                      >
                        {getYearLevelText(memberData.member.yearLevel)}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <span className="font-medium text-gray-700 dark:text-gray-300 truncate">
                      {memberData.member.email || "No email"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <span className="font-medium text-gray-700 dark:text-gray-300 truncate">
                      {getFacultyName(currentUserFacultyId as string) || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {memberData.member.studentId}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-all duration-200"
                onClick={() => onEdit(memberData)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 transition-all duration-200"
                onClick={() => onDelete(memberData)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
