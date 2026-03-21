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
    // Card: very light green tint (#EAF3DE = green-50 from your palette)
    <div
      className="rounded-xl px-4 sm:px-6 py-4 sm:py-6 mb-6"
      style={{
        background:
          "linear-gradient(135deg, #ffffff 10%, #EAF3DE 100%, #C0DD97 100%)",
        boxShadow: "0 4px 24px 0 rgba(5,140,17,0.08)",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
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

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h1
              className="font-nunito text-2xl font-bold tracking-tight"
              style={{ color: "#27500A" }}
            >
              Event Attendees
            </h1>
            {/* Pulsing green dot */}
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "#38B000" }}
            />
          </div>
          <p
            className="font-nunito-sans text-base leading-relaxed"
            style={{ color: "#3B6D11" }}
          >
            Manage and view attendees for this event
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="relative mb-6">
        <div
          className="h-px w-full"
          style={{
            background:
              "linear-gradient(to right, transparent, #97C459, transparent)",
          }}
        />
      </div>

      {/* Event info */}
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-4">
          {/* Name + badges row */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2
                className="font-nunito text-xl font-bold break-words leading-tight mb-1"
                style={{ color: "#27500A" }}
              >
                {event.name}
              </h2>
              {/* Green underline accent */}
              <div
                className="w-10 h-0.5 rounded-full"
                style={{
                  background: "linear-gradient(to right, #058C11, #87D300)",
                }}
              />
            </div>

            <div className="flex flex-wrap gap-2 sm:flex-shrink-0">
              <Badge
                variant={getBadgeVariant()}
                className="px-3 py-1 text-xs font-semibold shadow-sm border-0"
                style={{ background: "#C0DD97", color: "#27500A" }}
              >
                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
              </Badge>
              {event.majorEvent && (
                <Badge
                  variant="outline"
                  className="px-3 py-1 text-xs font-semibold shadow-sm flex items-center gap-1"
                  style={{
                    background: "#fefce8",
                    color: "#92400e",
                    borderColor: "#fde68a",
                  }}
                >
                  <StarIcon className="h-3 w-3 fill-amber-500" />
                  Major Event
                </Badge>
              )}
            </div>
          </div>

          {/* Event metrics in a grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Date */}
            <div
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ background: "#ffffff" }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "#EAF3DE" }}
              >
                <CalendarIcon
                  className="h-4 w-4"
                  style={{ color: "#058C11" }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-medium font-nunito-sans uppercase tracking-wide"
                  style={{ color: "#3B6D11" }}
                >
                  Date
                </p>
                <p
                  className="text-sm font-semibold font-nunito truncate"
                  style={{ color: "#27500A" }}
                >
                  {formatDate(event.date)}
                </p>
              </div>
            </div>

            {/* Location */}
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

            {/* Attendees */}
            <div
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ background: "#ffffff" }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "#EAF3DE" }}
              >
                <UsersIcon className="h-4 w-4" style={{ color: "#058C11" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-medium font-nunito-sans uppercase tracking-wide"
                  style={{ color: "#3B6D11" }}
                >
                  Attendees
                </p>
                <p
                  className="text-sm font-semibold font-nunito"
                  style={{ color: "#27500A" }}
                >
                  {attendeeCount} total
                </p>
              </div>
            </div>
          </div>

          {/* Event note if available */}
          {event.note && (
            <div
              className="p-4 rounded-lg border"
              style={{ background: "#ffffff", borderColor: "#C0DD97" }}
            >
              <p
                className="text-xs font-medium font-nunito-sans uppercase tracking-wide mb-2"
                style={{ color: "#3B6D11" }}
              >
                Event Note
              </p>
              <p
                className="text-sm font-nunito leading-relaxed"
                style={{ color: "#27500A" }}
              >
                {event.note}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
