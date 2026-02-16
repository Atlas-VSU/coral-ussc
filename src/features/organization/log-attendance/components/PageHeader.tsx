import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ArrowLeftIcon, ClockIcon, StarIcon } from "lucide-react";
import Link from "next/link";
import { formatTimeRange } from "../utils";
import { Event } from "../../events/types";
import { formatDate } from "@/utils/useGeneralUtils";

interface PageHeaderProps {
  event: Event;
}

export function PageHeader({ event }: PageHeaderProps) {
  return (
    <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 dark:from-gray-800 dark:via-gray-800 dark:to-gray-700/50 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-lg shadow-blue-100/50 dark:shadow-gray-900/20 p-6 mb-6">
      {/* Header Section */}
      <div className="flex items-start gap-3 mb-6">
        <Button 
          variant="outline" 
          size="icon" 
          asChild 
          className="h-10 w-10 rounded-xl bg-white/80 hover:bg-white dark:bg-gray-700/50 dark:hover:bg-gray-700 border-gray-300/60 dark:border-gray-600/60 shadow-sm transition-all duration-200 hover:scale-105"
        >
          <Link href={`/org-events`}>
            <ArrowLeftIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </Link>
        </Button>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-nunito text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              {event.status === "completed" ? "Log Special Attendance" : "Log Attendance"}
            </h1>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
          </div>
          <p className="font-nunito-sans text-base text-gray-600/90 dark:text-gray-400/90 leading-relaxed">
            {event.status === "completed" 
              ? "Record special attendance for this completed event" 
              : "Record student attendance for this event"}
          </p>
        </div>
      </div>

      {/* Event Details Section */}
      <div className="relative">
        {/* Subtle divider */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-300/60 dark:via-gray-600/60 to-transparent"></div>
        
        <div className="pt-6">
          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
            {/* Event Info */}
            <div className="flex-1 min-w-0 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="font-nunito text-xl font-bold text-gray-900 dark:text-gray-100 break-words leading-tight mb-1">
                    {event.name}
                  </h2>
                  <div className="w-10 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                </div>
                
                {/* Event badges positioned near event name */}
                <div className="flex flex-wrap gap-2 sm:flex-shrink-0">
                  <Badge 
                    variant="secondary" 
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 dark:from-blue-900/40 dark:to-indigo-900/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-700/60 font-nunito-sans font-semibold px-2.5 py-1 text-sm rounded-lg shadow-sm"
                  >
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </Badge>

                  {event.majorEvent && (
                    <Badge className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 text-amber-800 border border-amber-200/60 dark:from-amber-900/40 dark:via-yellow-900/40 dark:to-orange-900/40 dark:text-amber-300 dark:border-amber-600/60 px-2.5 py-1 font-nunito-sans font-bold text-sm rounded-lg shadow-sm">
                      <StarIcon className="h-3.5 w-3.5 mr-1 fill-amber-600 dark:fill-amber-400" />
                      Major Event
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Event Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date */}
                <div className="flex items-start gap-3 group">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-400/20 dark:to-indigo-400/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                    <CalendarIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-nunito-sans text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Event Date</p>
                    <p className="font-nunito text-base font-semibold text-gray-900 dark:text-gray-100">{formatDate(event.date)}</p>
                  </div>
                </div>

                {/* Time Schedule */}
                <div className="flex items-start gap-3 group">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-400/20 dark:to-teal-400/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                    <ClockIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-nunito-sans text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Schedule</p>
                    {event.timeInStart && event.timeInEnd ? (
                      <div className="space-y-0.5">
                        <p className="font-nunito text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Time-in: {formatTimeRange(event.timeInStart, event.timeInEnd)}
                        </p>
                        {event.timeOutStart && event.timeOutEnd && (
                          <p className="font-nunito text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Time-out: {formatTimeRange(event.timeOutStart, event.timeOutEnd)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="font-nunito text-sm text-gray-600 dark:text-gray-400 italic">No time schedule set</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
