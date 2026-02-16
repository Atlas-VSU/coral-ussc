import { MemberData, Faculty, Program } from "../types";
import { MemberCard } from "./MemberCard";

interface MembersListProps {
  members: MemberData[];
  programs: Program[];
  faculties: Faculty[];
  onEdit: (member: MemberData) => void;
  onDelete: (member: MemberData) => void;
}

export function MembersList({
  members,
  programs,
  faculties,
  onEdit,
  onDelete,
}: MembersListProps) {

  if (members.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-12 text-center">
        <div className="max-w-sm mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No members found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Try adjusting your search or filter criteria, or add a new member to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((memberData) => (
          <MemberCard
            key={memberData.id}
            memberData={memberData}
            programs={programs}
            faculties={faculties}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
