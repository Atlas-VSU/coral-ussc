import { useState, useEffect } from "react";
import { AttendanceForm } from "./AttendanceForm";
import { RecentAttendance } from "./RecentAttendance";
import { AttendanceTypeModal } from "./AttendanceTypeModal";
import { Event } from "../../events/types";

interface AttendanceInterfaceProps {
  event: Event;
  onLogAttendance: (
    studentId: string,
    type: "time-in" | "time-out"
  ) => Promise<void>;
}

export function AttendanceInterface({
  event,
  onLogAttendance,
}: AttendanceInterfaceProps) {
  const hasTimeIn = !!event.timeInStart && !!event.timeInEnd;
  const hasTimeOut = !!event.timeOutStart && !!event.timeOutEnd;

  const defaultTab = hasTimeIn ? "time-in" : "time-out";
  const [activeTab, setActiveTab] = useState<"time-in" | "time-out">(defaultTab);

  const [showTypeModal, setShowTypeModal] = useState(hasTimeIn && hasTimeOut);

  useEffect(() => {
    if (
      (!hasTimeIn && activeTab === "time-in") ||
      (!hasTimeOut && activeTab === "time-out")
    ) {
      setActiveTab(hasTimeIn ? "time-in" : "time-out");
    }
  }, [hasTimeIn, hasTimeOut, activeTab]);

  const handleSubmit = async (studentId: string) => {
    await onLogAttendance(studentId, activeTab);
  };

  return (
    <div className="space-y-4">
      {/* Type Selection Modal */}
      <AttendanceTypeModal
        open={showTypeModal}
        onOpenChange={setShowTypeModal}
        onSelect={setActiveTab}
        event={event}
      />

      {/* Attendance Form */}
      <div
        className="rounded-xl"
        style={{
          background: "linear-gradient(135deg, #ffffff 10%, #EAF3DE 100%, #C0DD97 100%)",
          boxShadow: "0 4px 24px 0 rgba(5,140,17,0.08)",
        }}
      >
        <div className="p-4 sm:p-6">
          <AttendanceForm
            event={event}
            type={activeTab}
            onSubmit={handleSubmit}
            hasTimeIn={hasTimeIn}
            hasTimeOut={hasTimeOut}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div
        className="rounded-xl"
        style={{
          background: "linear-gradient(135deg, #ffffff 10%, #EAF3DE 100%, #C0DD97 100%)",
          boxShadow: "0 4px 24px 0 rgba(5,140,17,0.08)",
        }}
      >
        <div className="p-4 sm:p-6">
          <RecentAttendance eventId={event.id.toString()} type={activeTab} />
        </div>
      </div>
    </div>
  );
}