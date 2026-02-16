import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircleIcon, XCircleIcon, Loader2Icon } from "lucide-react";
import { getInitials } from "../../utils";
import { Member } from "@/features/organization/members/types";

interface StudentDetailsProps {
  student: Member;
  showNames: boolean;
  isSubmitting: boolean;
  type: "time-in" | "time-out";
  buttonVariant?: "default" | "success";
  onCancel?: () => void;
}

export function StudentDetails({
  student,
  showNames,
  isSubmitting,
  type,
  buttonVariant = "default",
  onCancel,
}: StudentDetailsProps) {
  const buttonClasses =
    buttonVariant === "success"
      ? "bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500 text-white shadow-lg hover:shadow-xl transition-all"
      : "bg-primary hover:bg-primary/90 dark:bg-blue-600 dark:hover:bg-blue-500 text-white shadow-lg hover:shadow-xl transition-all";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-1">
        <div className="flex items-center gap-3 sm:gap-4 flex-1">
          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 bg-primary/10 text-primary border border-gray-200 dark:border-gray-700 flex-shrink-0">
            <AvatarFallback className="font-nunito-sans font-semibold text-sm sm:text-base">
              {showNames
                ? getInitials(student.firstName + " " + student.lastName)
                : "ST"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-nunito text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                  {showNames
                    ? student.firstName + " " + student.lastName
                    : "Student"}
                </h3>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700 font-nunito-sans font-semibold text-xs w-fit">
                  ID: {student.studentId}
                </Badge>
              </div>
              {showNames && (
                <p className="font-nunito-sans text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                  {student.email}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:justify-end justify-center gap-2 sm:gap-3 w-full">
        {onCancel && !isSubmitting && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 sm:flex-none h-9 sm:h-10 font-nunito-sans font-semibold border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 min-w-[100px]"
          >
            <XCircleIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Cancel
          </Button>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className={`flex-1 sm:flex-none h-9 sm:h-10 font-nunito-sans font-semibold min-w-[120px] ${buttonClasses} ${
            isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:scale-[1.02]"
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <Loader2Icon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin dark:text-white dark:fill-gray-700" />
              <span className="text-xs sm:text-sm">Processing...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <CheckCircleIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">{type === "time-in" ? "Check In" : "Check Out"}</span>
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
