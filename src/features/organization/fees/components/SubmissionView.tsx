// app/admin/fees/roster/components/SubmissionsView.tsx
import { PaymentTable, PaymentCards } from "@/features/organization/fees-roster/components/PaymentDisplay"; // shared display components
import type { PaymentLog } from "@/features/organization/fees/types";

export function SubmissionsView({
  logs,
  viewMode,
  onViewDetails,
}: {
  logs: PaymentLog[];
  viewMode: "card" | "table";
  onViewDetails: (log: PaymentLog) => void;
}) {
  if (viewMode === "table") {
    return <PaymentTable logs={logs} onViewDetails={onViewDetails} />;
  }
  return <PaymentCards logs={logs} onViewDetails={onViewDetails} />;
}