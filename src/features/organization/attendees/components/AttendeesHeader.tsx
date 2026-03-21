import { Button } from "@/components/ui/button";
import { Event } from "../../events/types";
import { UserPlus, Upload, Loader2, Zap } from "lucide-react";
import Link from "next/link";

interface AttendeesHeaderProps {
  event: Event;
  onExport: () => void;
  onGenerateFines?: () => void;
  isExporting?: boolean;
  isGenerating?: boolean;
}

export function AttendeesHeader({
  event,
  onExport,
  isExporting = false,
  onGenerateFines,
  isGenerating = false,
}: AttendeesHeaderProps) {
  return (
    <div
      className="rounded-xl px-4 sm:px-6 py-4 sm:py-6"
      style={{
        background:
          "linear-gradient(135deg, #ffffff 10%, #EAF3DE 100%, #C0DD97 100%)",
        borderColor: "#97C459",
        boxShadow: "0 4px 24px 0 rgba(5,140,17,0.08)",
      }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: icon + title */}
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center shadow-sm"
            style={{ background: "linear-gradient(135deg, #058C11, #38B000)" }}
          >
            <UserPlus className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2
              className="font-nunito text-xl font-bold"
              style={{ color: "#27500A" }}
            >
              Manage Attendees
            </h2>
            <p
              className="font-nunito-sans text-sm"
              style={{ color: "#3B6D11" }}
            >
              View, track, and export attendance records
            </p>
          </div>
        </div>

        {/* Right: action buttons */}
        <div className="flex flex-wrap gap-3">
          {(event.status === "ongoing" || event.status === "completed") && (
            <Button
              asChild
              className="justify-center gap-1.5 h-10 sm:h-9 text-xs font-bold"
              style={{ background: "#058C11", color: "#ffffff" }}
            >
              <Link href={`/org-events/${event.id}/log-attendance`}>
                <UserPlus className="h-4 w-4 mr-2" />
                {event.status === "completed"
                  ? "Log Special Attendance"
                  : "Log Attendance"}
              </Link>
            </Button>
          )}

          {event.status === "completed" && !event.finesGenerated && (
            <Button
              variant="outline"
              onClick={onGenerateFines}
              disabled={isGenerating}
              style={{
                borderColor: "#97C459",
                color: "#27500A",
                background: "#ffffff",
              }}
            >
              <Zap className="size-4 mr-1" style={{ color: "#058C11" }} />
              Generate Fines
            </Button>
          )}

          <Button
            variant="outline"
            onClick={onExport}
            disabled={isExporting}
            className="shadow-sm transition-all duration-200 hover:scale-[1.02]"
            style={{
              borderColor: "#97C459",
              color: "#27500A",
              background: "#ffffff",
            }}
          >
            {isExporting ? (
              <>
                <Loader2
                  className="h-4 w-4 mr-2 animate-spin"
                  style={{ color: "#058C11" }}
                />
                Exporting...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" style={{ color: "#058C11" }} />
                Export
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
