import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  StarIcon,
  ArrowLeftIcon,
} from "lucide-react";
import Link from "next/link";
import { Event } from "../../events/types";
import { formatDate } from "@/utils/useGeneralUtils";

interface EventDetailsProps {
  event: Event;
  attendeeCount: number;
}

export function EventDetails({ event, attendeeCount }: EventDetailsProps) {
  // Get badge variant based on status
  const getBadgeVariant = () => {
    switch (event.status) {
      case "ongoing":
        return "default";
      case "upcoming":
        return "secondary";
      case "completed":
        return "secondary";
      case "archived":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 dark:from-gray-800 dark:via-gray-800 dark:to-gray-700/50 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-lg shadow-blue-100/50 dark:shadow-gray-900/20 px-4 sm:px-6 py-4 sm:py-6 mb-6">
      {/* Header Section */}
      <div className="flex items-start justify-between gap-4 mb-6">
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
              Event Attendees
            </h1>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
          </div>
          <p className="font-nunito-sans text-base text-gray-600/90 dark:text-gray-400/90 leading-relaxed">
            Manage and view attendees for this event
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
                    variant={getBadgeVariant()} 
                    className="px-3 py-1 text-xs font-semibold shadow-sm border-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-700 dark:text-blue-300"
                  >
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </Badge>
                  {event.majorEvent && (
                    <Badge
                      variant="outline"
                      className="px-3 py-1 text-xs font-semibold bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-700/60 shadow-sm flex items-center gap-1"
                    >
                      <StarIcon className="h-3 w-3 fill-amber-500" />
                      Major Event
                    </Badge>
                  )}
                </div>
              </div>

              {/* Event metrics in a grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-gray-200/40 dark:border-gray-700/40 backdrop-blur-sm">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CalendarIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium font-nunito-sans text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Date
                    </p>
                    <p className="text-sm font-semibold font-nunito text-gray-900 dark:text-gray-100 truncate">
                      {formatDate(event.date)}
                    </p>
                  </div>
                </div>

                {/* <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-gray-200/40 dark:border-gray-700/40 backdrop-blur-sm">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ClockIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium font-nunito-sans text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Time
                    </p>
                    <div className="text-sm font-semibold font-nunito text-gray-900 dark:text-gray-100">
                      {getTimeDisplay()}
                    </div>
                  </div>
                </div> */}

                <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-gray-200/40 dark:border-gray-700/40 backdrop-blur-sm">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPinIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium font-nunito-sans text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Location
                    </p>
                    <p className="text-sm font-semibold font-nunito text-gray-900 dark:text-gray-100 truncate">
                      {event.location}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-gray-200/40 dark:border-gray-700/40 backdrop-blur-sm">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <UsersIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium font-nunito-sans text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Attendees
                    </p>
                    <p className="text-sm font-semibold font-nunito text-gray-900 dark:text-gray-100">
                      {attendeeCount} total
                    </p>
                  </div>
                </div>
              </div>

              {/* Event note if available */}
              {event.note && (
                <div className="p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-gray-200/40 dark:border-gray-700/40 backdrop-blur-sm">
                  <p className="text-xs font-medium font-nunito-sans text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Event Note
                  </p>
                  <p className="text-sm font-nunito text-gray-700 dark:text-gray-300 leading-relaxed">
                    {event.note}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
