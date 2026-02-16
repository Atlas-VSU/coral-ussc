import { MemberData, Faculty, Program } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Pencil,
  Trash2,
  Mail,
  Building2,
  Hash,
} from "lucide-react";

interface MemberCardProps {
  memberData: MemberData;
  programs: Program[];
  faculties: Faculty[];
  onEdit: (member: MemberData) => void;
  onDelete: (member: MemberData) => void;
}

export function MemberCard({
  memberData,
  programs,
  faculties,
  onEdit,
  onDelete,
}: MemberCardProps) {
  const getProgramName = (programId: string) => {
    const program = programs.find((p) => p.id === programId);
    return program ? program.name : "N/A";
  };

  const getFacultyName = (facultyId: string) => {
    const faculty = faculties.find((f) => f.id === facultyId);
    return faculty ? faculty.name : "N/A";
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

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden h-full flex flex-col hover:border-gray-300 dark:hover:border-gray-600">
      <CardContent className="p-0 flex flex-col flex-grow">
        {/* Member Header */}
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12 border border-gray-200 dark:border-gray-700">
              <AvatarFallback className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm">
                {getInitials(
                  memberData.member.firstName,
                  memberData.member.lastName
                )}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 break-words leading-tight tracking-tight">
                  {memberData.member.firstName} {memberData.member.lastName}
                </h3>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge
                    variant="secondary"
                    className="bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 font-medium text-xs px-2 py-1 tracking-wide"
                  >
                    {getProgramName(memberData.member.programId)}
                  </Badge>
                  {memberData.member.yearLevel !== undefined &&
                  memberData.member.yearLevel !== 0 ? (
                    <Badge
                      variant="outline"
                      className="text-xs font-medium border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 tracking-wide"
                    >
                      {getYearLevelText(memberData.member.yearLevel)}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-xs font-medium border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 tracking-wide"
                    >
                      N/A
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700"></div>

          {/* Member Details */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                <Mail className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
                  Email
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 break-all leading-relaxed">
                  {memberData.member.email || "No email provided"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                <Building2 className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
                  Faculty
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 break-words leading-relaxed">
                  {getFacultyName(memberData.member.facultyId as string)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                <Hash className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
                  Student ID
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 font-mono tracking-wide leading-relaxed break-all">
                  {memberData.member.studentId}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Spacer to push the buttons to the bottom */}
        <div className="flex-grow min-h-[10px]"></div>

        {/* Action Buttons */}
        <div className="flex border-t border-gray-200 dark:border-gray-700 mt-auto bg-gray-50/50 dark:bg-gray-800/50">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 rounded-none h-11 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
            onClick={() => onEdit(memberData)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <div className="border-r border-gray-200 dark:border-gray-700 h-11" />
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 rounded-none h-11 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/10 transition-colors duration-150"
            onClick={() => onDelete(memberData)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
