// app/admin/fees/roster/components/AllStudentsView.tsx
import { AllStudentsTable, AllStudentsCards, type Row } from "@/features/organization/fees-roster/components/AllStudentsDisplay";
import type { PaymentLog } from "@/features/organization/fees/types";
import type { Member } from "@/features/organization/members/types";

export function AllStudentsView({
  rows,
  viewMode,
  onViewDetails,
  onManualLog,
  filterStatus = "all",
}: {
  rows: Row[];
  viewMode: "card" | "table";
  onViewDetails: (log: PaymentLog) => void;
  onManualLog: (student: Partial<Member>) => void;
  filterStatus?: string;
}) {
  if (viewMode === "table") {
    return <AllStudentsTable rows={rows} onViewDetails={onViewDetails} onManualLog={onManualLog} filterStatus={filterStatus} />;
  }
  return <AllStudentsCards rows={rows} onViewDetails={onViewDetails} onManualLog={onManualLog} filterStatus={filterStatus} />;
}