import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ArrowLeftIcon, ClockIcon, StarIcon, MapPinIcon } from "lucide-react";
import Link from "next/link";
import { formatTimeRange } from "../utils";
import { Event } from "../../events/types";
import { formatDate } from "@/utils/useGeneralUtils";

interface PageHeaderProps {
  event: Event;
}

function StatusBadge({ status }: { status: Event["status"] }) {
  switch (status) {
    case "ongoing":
      return (
        <Badge
          className="font-semibold text-xs px-2.5 py-1 border-0 shadow-sm"
          style={{ background: "#C0DD97", color: "#27500A" }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse inline-block"
            style={{ background: "#058C11" }}
          />
          Ongoing
        </Badge>
      );
    case "upcoming":
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-semibold text-xs px-2.5 py-1">
          <CalendarIcon className="w-3 h-3 mr-1" />
          Upcoming
        </Badge>
      );
    case "completed":
      return (
        <Badge
          variant="outline"
          className="font-semibold text-xs px-2.5 py-1"
          style={{ borderColor: "#97C459", color: "#3B6D11", background: "#ffffff" }}
        >
          Completed
        </Badge>
      );
    case "archived":
      return (
        <Badge
          variant="outline"
          className="font-semibold text-xs px-2.5 py-1"
          style={{ color: "#3B6D11", borderColor: "#C0DD97" }}
        >
          Archived
        </Badge>
      );
  }
}

export function PageHeader({ event }: PageHeaderProps) {
  return (
    <div
      className="rounded-xl px-4 sm:px-6 py-4 sm:py-6 mb-6"
      style={{
        background: "linear-gradient(135deg, #ffffff 10%, #EAF3DE 100%, #C0DD97 100%)",
        boxShadow: "0 4px 24px 0 rgba(5,140,17,0.08)",
      }}
    >
      {/* Top row: back button + title */}
      <div className="flex items-start gap-3 mb-6">
        <Button
          variant="outline"
          size="icon"
          asChild
          className="h-10 w-10 rounded-xl shadow-sm transition-all duration-200 hover:scale-105"
          style={{ background: "#ffffff" }}
        >
          <Link href="/org-events">
            <ArrowLeftIcon className="h-4 w-4" style={{ color: "#3B6D11" }} />
          </Link>
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h1
              className="font-nunito text-xl font-bold"
              style={{ color: "#27500A" }}
            >
              {event.status === "completed" ? "Log Special Attendance" : "Log Attendance"}
            </h1>
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
              style={{ background: "#38B000" }}
            />
          </div>
          <p className="font-nunito-sans text-sm" style={{ color: "#3B6D11" }}>
            {event.status === "completed"
              ? "Record special attendance for this completed event"
              : "Record student attendance for this event"}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="relative mb-6">
        <div
          className="h-px w-full"
          style={{
            background: "linear-gradient(to right, transparent, #97C459, transparent)",
          }}
        />
      </div>

      {/* Event info */}
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-4">
          {/* Name + badges */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2
                className="font-nunito text-xl font-bold break-words leading-tight mb-1"
                style={{ color: "#27500A" }}
              >
                {event.name}
              </h2>
              <div
                className="w-10 h-0.5 rounded-full"
                style={{ background: "linear-gradient(to right, #058C11, #87D300)" }}
              />
            </div>
            <div className="flex flex-wrap gap-2 sm:flex-shrink-0">
              <StatusBadge status={event.status} />
              {event.majorEvent && (
                <Badge
                  variant="outline"
                  className="px-2.5 py-1 text-xs font-semibold shadow-sm flex items-center gap-1"
                  style={{ background: "#fefce8", color: "#92400e", borderColor: "#fde68a" }}
                >
                  <StarIcon className="h-3 w-3 fill-amber-500" />
                  Major
                </Badge>
              )}
            </div>
          </div>

          {/* Detail grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Date */}
            <div
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ background: "#ffffff" }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "#EAF3DE" }}
              >
                <CalendarIcon className="h-4 w-4" style={{ color: "#058C11" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-medium font-nunito-sans uppercase tracking-wide"
                  style={{ color: "#3B6D11" }}
                >
                  Event Date
                </p>
                <p
                  className="text-sm font-semibold font-nunito truncate"
                  style={{ color: "#27500A" }}
                >
                  {formatDate(event.date)}
                </p>
              </div>
            </div>

            {/* Schedule */}
            <div
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ background: "#ffffff" }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "#EAF3DE" }}
              >
                <ClockIcon className="h-4 w-4" style={{ color: "#058C11" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-medium font-nunito-sans uppercase tracking-wide"
                  style={{ color: "#3B6D11" }}
                >
                  Schedule
                </p>
                {event.timeInStart && event.timeInEnd ? (
                  <div className="space-y-0.5">
                    <p
                      className="text-xs font-semibold uppercase tracking-wide font-nunito"
                      style={{ color: "#27500A" }}
                    >
                      In: {formatTimeRange(event.timeInStart, event.timeInEnd)}
                    </p>
                    {event.timeOutStart && event.timeOutEnd && (
                      <p
                        className="text-xs font-semibold uppercase tracking-wide font-nunito"
                        style={{ color: "#27500A" }}
                      >
                        Out: {formatTimeRange(event.timeOutStart, event.timeOutEnd)}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm font-nunito" style={{ color: "#3B6D11" }}>
                    No time schedule set
                  </p>
                )}
              </div>
            </div>

            {/* Location */}
            {event.location && (
              <div
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ background: "#ffffff" }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "#EAF3DE" }}
                >
                  <MapPinIcon className="h-4 w-4" style={{ color: "#058C11" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-medium font-nunito-sans uppercase tracking-wide"
                    style={{ color: "#3B6D11" }}
                  >
                    Location
                  </p>
                  <p
                    className="text-sm font-semibold font-nunito truncate"
                    style={{ color: "#27500A" }}
                  >
                    {event.location}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}