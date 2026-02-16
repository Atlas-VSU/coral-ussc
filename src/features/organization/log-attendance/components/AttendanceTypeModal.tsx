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
  // Determine which options are available
  const hasTimeIn = !!event.timeInStart && !!event.timeInEnd;
  const hasTimeOut = !!event.timeOutStart && !!event.timeOutEnd;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-nunito font-bold text-center">
            Select Attendance Type
          </DialogTitle>
          <DialogDescription className="text-center">
            What would you like to record for {event.name}?
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {hasTimeIn && (
            <Button
              size="lg"
              onClick={() => {
                onSelect("time-in");
                onOpenChange(false);
              }}
              className="h-auto py-6 px-4 flex flex-col items-center justify-center gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <ClockIcon className="h-6 w-6" />
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg">Check-In</div>
                <div className="text-xs opacity-90 mt-1">
                  Attendance begins!
                </div>
              </div>
            </Button>
          )}

          {hasTimeOut && (
            <Button
              size="lg"
              variant={hasTimeIn ? "outline" : "default"}
              onClick={() => {
                onSelect("time-out");
                onOpenChange(false);
              }}
              className="h-auto py-6 px-4 flex flex-col items-center justify-center gap-3"
            >
              <div
                className={`w-12 h-12 rounded-full ${
                  hasTimeIn ? "bg-gray-100 dark:bg-gray-800" : "bg-white/20"
                } flex items-center justify-center`}
              >
                <TimerIcon className="h-6 w-6" />
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg">Check-Out</div>
                <div className="text-xs opacity-90 mt-1">
                  Marks departure...
                </div>
              </div>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
