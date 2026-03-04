// app/admin/fees/roster/components/AllStudentsView.tsx
import { AllStudentsTable, AllStudentsCards, type Row } from "@/features/organization/fees/components/AllStudentsDisplay";
import type { PaymentLog } from "@/features/organization/fees/types";
import type { Member } from "@/features/organization/members/types";

export function AllStudentsView({
  rows,
  viewMode,
  onViewDetails,
  onManualLog,
}: {
  rows: Row[];
  viewMode: "card" | "table";
  onViewDetails: (log: PaymentLog) => void;
  onManualLog: (student: Partial<Member>) => void;
}) {
  if (viewMode === "table") {
    return <AllStudentsTable rows={rows} onViewDetails={onViewDetails} onManualLog={onManualLog} />;
  }
  return <AllStudentsCards rows={rows} onViewDetails={onViewDetails} onManualLog={onManualLog} />;
}