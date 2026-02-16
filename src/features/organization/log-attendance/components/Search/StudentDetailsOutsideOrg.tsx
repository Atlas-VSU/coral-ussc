import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircleIcon, XCircleIcon, Loader2Icon, AlertTriangle } from "lucide-react";
import { getInitials } from "../../utils";
import { Member } from "@/features/organization/members/types";

interface StudentDetailsOutsideOrgProps {
  student: Member;
  showNames: boolean;
  isSubmitting: boolean;
  type: "time-in" | "time-out";
  level: "Organization" | "Faculty"
  buttonVariant?: "default" | "success" | "warning";
  onCancel?: () => void;
}

export function StudentDetailsOutsideOrg({
  student,
  showNames,
  isSubmitting,
  type,
  // You might want to default to a 'warning' style button logic here if desired, 
  // but we'll stick to the prop for consistency.
  buttonVariant = "default", 
  onCancel,
}: StudentDetailsOutsideOrgProps) {
  
  // Adjusted button classes to fit the "Warning" theme if it's the default action
  // If it's "success", we keep it green, otherwise we make it a strong amber/dark action
  const buttonClasses =
    buttonVariant === "success"
      ? "bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500 text-white shadow-lg hover:shadow-xl transition-all"
      : "bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500 text-white shadow-lg hover:shadow-xl transition-all border-amber-700 dark:border-amber-600";

  return (
    <div className="relative overflow-hidden flex flex-col gap-4 p-3 sm:p-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 border-l-4 border-l-amber-500">
      
      {/* Background Icon Watermark (Optional decoration) */}
      <AlertTriangle className="absolute -right-6 -top-6 h-16 w-16 sm:h-24 sm:w-24 text-amber-500/5 dark:text-amber-500/10 pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 relative z-10">
        <div className="flex items-center gap-3 sm:gap-4 flex-1">
          <div className="relative flex-shrink-0">
              <Avatar className="h-12 w-12 sm:h-14 sm:w-14 bg-amber-100 text-amber-700 border-2 border-amber-200 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
              <AvatarFallback className="font-nunito-sans font-bold text-sm sm:text-base">
                  {showNames
                  ? getInitials(student.firstName + " " + student.lastName)
                  : "ST"}
              </AvatarFallback>
              </Avatar>
              {/* Warning Indicator Badge on Avatar */}
              <div className="absolute -bottom-1 -right-1 bg-amber-100 dark:bg-amber-900 rounded-full p-0.5 border border-amber-200 dark:border-amber-700">
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400" />
              </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <h3 className="font-nunito text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                  {showNames
                      ? student.firstName + " " + student.lastName
                      : "Student"}
                  </h3>
                   {/* Warning Label */}
                   <span className="inline-flex sm:inline-flex items-center text-[10px] uppercase tracking-wider font-bold text-amber-700 dark:text-amber-500 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full self-start">
                      External
                   </span>
              </div>
              
              <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                  <Badge variant="outline" className="bg-white/50 dark:bg-black/20 text-gray-700 border-amber-200 dark:text-gray-300 dark:border-amber-800 font-mono text-xs w-fit">
                  ID: {student.studentId}
                  </Badge>
                  {showNames && (
                      <p className="font-nunito-sans text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                      {student.email}
                      </p>
                  )}
              </div>
              
              {/* Mobile-only warning text */}
              <p className="sm:hidden text-xs text-amber-700 dark:text-amber-500 font-medium">
                  ⚠️ Outside Organization
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 w-full relative z-10">
        {onCancel && !isSubmitting && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="flex-1 sm:flex-none h-9 sm:h-10 font-nunito-sans font-semibold text-gray-600 hover:text-gray-800 hover:bg-amber-100/50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-amber-900/30"
          >
            <XCircleIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Cancel
          </Button>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className={`flex-1 sm:flex-none h-9 sm:h-10 font-nunito-sans font-semibold min-w-[120px] sm:min-w-[140px] ${buttonClasses} ${
            isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:scale-[1.02]"
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <Loader2Icon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
              <span className="text-xs sm:text-sm">Processing...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center">
              {/* Using AlertTriangle here to reinforce that this is an override action */}
              <CheckCircleIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">{type === "time-in" ? "Accept & Time In" : "Accept & Time Out"}</span>
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}