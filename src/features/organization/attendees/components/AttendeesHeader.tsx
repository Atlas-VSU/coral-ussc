import { Button } from "@/components/ui/button";
import { Event } from "../../events/types";
import { UserPlus, Upload, Loader2 } from "lucide-react";
import Link from "next/link";

interface AttendeesHeaderProps {
  event: Event;
  onExport: () => void;
  isExporting?: boolean;
}

export function AttendeesHeader({ event, onExport, isExporting = false }: AttendeesHeaderProps) {
  return (
    <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 dark:from-gray-800 dark:via-gray-800 dark:to-gray-700/50 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-lg shadow-blue-100/50 dark:shadow-gray-900/20 px-4 sm:px-6 py-4 sm:py-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Header Section */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <UserPlus className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-nunito text-xl font-bold text-gray-900 dark:text-gray-100">
              Manage Attendees
            </h2>
            <p className="font-nunito-sans text-sm text-gray-600 dark:text-gray-400">
              View, track, and export attendance records
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {/* Show Log Attendance button for ongoing events and Log Special Attendance for completed events */}
          {(event.status === "ongoing" || event.status === "completed") && (
            <Button 
              asChild 
              className="bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg transition-all duration-200 hover:scale-[1.02] border-0"
            >
              <Link href={`/org-events/${event.id}/log-attendance`}>
                <UserPlus className="h-4 w-4 mr-2" />
                {event.status === "completed" ? "Log Special Attendance" : "Log Attendance"}
              </Link>
            </Button>
          )}

          <Button
            variant="outline"
            onClick={onExport}
            disabled={isExporting}
            className="bg-white/80 dark:bg-gray-800/60 border-gray-300/60 dark:border-gray-600/60 hover:bg-white dark:hover:bg-gray-800 shadow-sm transition-all duration-200 hover:scale-[1.02]"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}