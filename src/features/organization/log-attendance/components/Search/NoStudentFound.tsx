import { Button } from "@/components/ui/button";
import { UserPlusIcon, Loader2 } from "lucide-react";
import { useState } from "react";

interface NoStudentFoundProps {
  searchTerm: string;
  searchType: "id" | "name";
  onAddStudent: () => void;
}

export function NoStudentFound({
  searchTerm,
  searchType,
  onAddStudent,
}: NoStudentFoundProps) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddStudent = async () => {
    setIsAdding(true);
    try {
      await onAddStudent();
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="rounded-lg border p-4 bg-muted/30">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
        <div>
          <h3 className="font-medium mb-1">
            {searchType === "id" ? "Student Not Found" : "No Students Found"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {searchType === "id"
              ? `No student found with ID ${searchTerm}`
              : `No students matching "${searchTerm}"`}
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleAddStudent}
          disabled={isAdding}
          className="w-full sm:w-auto"
        >
          {isAdding ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <UserPlusIcon className="h-4 w-4 mr-2" />
              Add Student
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
