import { Loader2Icon } from "lucide-react";

interface ProcessingOverlayProps {
  type: "time-in" | "time-out";
  showNames: boolean;
  studentName?: string;
}

export function ProcessingOverlay({
  type,
  showNames,
  studentName,
}: ProcessingOverlayProps) {
  const action = type === "time-in" ? "Checking in" : "Checking out";
  const studentText = showNames && studentName ? studentName : "Student";

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-xl max-w-md w-full mx-4 border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-4">
            <Loader2Icon className="h-8 w-8 text-primary animate-spin" />
          </div>

          <h3 className="text-xl font-nunito font-semibold mb-2 text-gray-900 dark:text-gray-50">
            Processing Attendance
          </h3>

          <p className="text-gray-600 dark:text-gray-300 mb-4 font-nunito-sans">
            {action} {studentText}. Please wait while we record the attendance.
          </p>

          <div className="flex items-center justify-center space-x-2 text-sm">
            <span className="inline-block h-2 w-2 bg-primary rounded-full animate-pulse"></span>
            <span className="inline-block h-2 w-2 bg-primary rounded-full animate-pulse delay-150"></span>
            <span className="inline-block h-2 w-2 bg-primary rounded-full animate-pulse delay-300"></span>
          </div>
        </div>
      </div>
    </div>
  );
}
