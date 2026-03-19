import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClockIcon, TimerIcon } from "lucide-react";
import { Event } from "../../events/types";

interface AttendanceTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: "time-in" | "time-out") => void;
  event: Event;
}

export function AttendanceTypeModal({
  open,
  onOpenChange,
  onSelect,
  event,
}: AttendanceTypeModalProps) {
  const hasTimeIn = !!event.timeInStart && !!event.timeInEnd;
  const hasTimeOut = !!event.timeOutStart && !!event.timeOutEnd;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle
            className="font-nunito text-xl font-bold text-center"
            style={{ color: "#27500A" }}
          >
            Select Attendance Type
          </DialogTitle>
          <DialogDescription
            className="font-nunito-sans text-center"
            style={{ color: "#3B6D11" }}
          >
            What would you like to record for{" "}
            <span className="font-semibold" style={{ color: "#27500A" }}>
              {event.name}
            </span>
            ?
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {hasTimeIn && (
            <button
              onClick={() => {
                onSelect("time-in");
                onOpenChange(false);
              }}
              className="group flex flex-col items-center justify-center gap-3 py-6 px-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
              style={{
                borderColor: "#97C459",
                background: "#EAF3DE",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#C0DD97";
                (e.currentTarget as HTMLElement).style.borderColor = "#058C11";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#EAF3DE";
                (e.currentTarget as HTMLElement).style.borderColor = "#97C459";
              }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center transition-colors"
                style={{ background: "linear-gradient(135deg, #058C11, #38B000)" }}
              >
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
              <div className="text-center">
                <div
                  className="font-nunito font-bold text-base"
                  style={{ color: "#27500A" }}
                >
                  Check-In
                </div>
                <div
                  className="font-nunito-sans text-xs mt-0.5"
                  style={{ color: "#3B6D11" }}
                >
                  Attendance begins!
                </div>
              </div>
            </button>
          )}

          {hasTimeOut && (
            <button
              onClick={() => {
                onSelect("time-out");
                onOpenChange(false);
              }}
              className="group flex flex-col items-center justify-center gap-3 py-6 px-4 rounded-xl border-2 border-amber-200 bg-amber-50/50 hover:bg-amber-100/60 hover:border-amber-400 transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
            >
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                <TimerIcon className="h-6 w-6 text-amber-700" />
              </div>
              <div className="text-center">
                <div className="font-nunito font-bold text-base text-amber-800">
                  Check-Out
                </div>
                <div className="font-nunito-sans text-xs text-amber-600 mt-0.5">
                  Marks departure...
                </div>
              </div>
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}